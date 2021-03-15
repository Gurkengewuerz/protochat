import {writeFile} from "capacitor-blob-writer";
import CryptoJS from "crypto-js";
import moment from "moment";
import React, {useEffect, useState} from "react";

import {Plugins, FilesystemDirectory, Capacitor} from "@capacitor/core";

const {Filesystem} = Plugins;

const CachedIMG = ({src, fetchSrc, alt, className, cacheTime, imgRef, rerender}) => {
  if (cacheTime === undefined || cacheTime === null) cacheTime = 7 * 24 * 60 * 60 * 1000;

  const now = moment().utc().unix();
  const folder = FilesystemDirectory.Cache;
  const supportsCaching = ["ios", "android"].includes(Capacitor.platform);
  const [finalSrc, setFinalSrc] = useState(src);

  let identifier = "";
  let filePath = "";

  const convertBlobToBase64 = blob =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

  const downloadAndSave = async s => {
    console.log(`download ${filePath} and save`);
    const res = await fetch(s);
    const blob = await res.blob();

    if (supportsCaching) {
      const {uri} = await writeFile({
        path: filePath,
        directory: folder,
        data: blob,
        recursive: true,
        fallback: false,
      });
      const fileURL = Capacitor.convertFileSrc(uri);
      setFinalSrc(Capacitor.convertFileSrc(fileURL));
    } else {
      const base64Data = await convertBlobToBase64(blob);
      await Filesystem.writeFile({
        path: filePath,
        directory: folder,
        data: base64Data,
      });

      setFinalSrc(URL.createObjectURL(blob));
    }
  };

  useEffect(() => {
    const x = async () => {
      let fetchedSrc = null;
      try {
        fetchedSrc = await fetchSrc();
      } catch (e) {
        console.error("error fetching src for " + alt);
        return;
      }
      if (fetchedSrc === null || fetchedSrc === undefined || !fetchedSrc) return;
      identifier = CryptoJS.SHA1(fetchedSrc).toString(CryptoJS.enc.Hex);
      filePath = `imgcache/${identifier}`;
      try {
        const {uri, mtime} = await Filesystem.stat({
          path: filePath,
          directory: folder,
        });

        const fileURL = Capacitor.convertFileSrc(uri);
        let fileBlob;
        if (fileURL.includes("://")) {
          const fileResponse = await fetch(fileURL);

          if (fileResponse.status === 404) {
            throw new Error("File not found");
          } else if (fileResponse.status !== 200) {
            throw new Error("bad status");
          }

          fileBlob = await fileResponse.blob();
        } else {
          const {data} = await Filesystem.readFile({
            path: filePath,
            directory: folder,
          });
          const url = "data:;base64," + data;
          const fileResponse = await fetch(url);
          fileBlob = await fileResponse.blob();
        }
        console.log(`setting cached file ${filePath}`);
        setFinalSrc(URL.createObjectURL(fileBlob));

        if (now - mtime > cacheTime) throw Error("file to old - redownload");
        else if (cacheTime === 0) throw Error("force refresh!");
      } catch (error) {
        downloadAndSave(fetchedSrc);
      }
    };
    x();
  }, [rerender]);

  return <img className={className} alt={alt} src={finalSrc} ref={imgRef} />;
};

export default CachedIMG;
