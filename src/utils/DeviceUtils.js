import {browsers, desktop, logoAndroid, logoApple, logoChrome, logoEdge, logoFirefox, logoWindows, tabletLandscape, terminal} from "ionicons/icons";

export const deviceRegEx = [
  {test: ["web"], icon: browsers},
  {test: ["tablet"], icon: tabletLandscape},
  {test: ["ios", "apple", "mac"], icon: logoApple},
  {test: ["android"], icon: logoAndroid},
  {test: ["firefox", "mozilla"], icon: logoFirefox},
  {test: ["chrome", "google"], icon: logoChrome},
  {test: ["edge", "microsoft"], icon: logoEdge},
  {test: ["windows"], icon: logoWindows},
  {test: ["linux"], icon: terminal},
];

export const getIcon = displayName => {
  var foundIcon = desktop;
  if (displayName) {
    displayName = displayName.toLowerCase().replace(" ", "");

    deviceRegEx.forEach(row => {
      if (row.test.some(v => displayName.includes(v))) foundIcon = row.icon;
    });
  }
  return foundIcon;
};
