# Protochat

Protochat is a multi-platform Matrix client written in JavaScript with the Ionic Support. It compiles to Android, iOS and runs on the Web. Protochat is just a hobby project and licensed under AGPLv3.  
⚠ This project is under heavy development. Because so many features are still missing, git commits are created with many files! ⚠

# Features 🎉
- Custom homeserver 🏠
- Registration/Login (only with password) 📚
- Application settings ⚙️

# How to build

1. [Install NodJS and NPM](https://nodejs.org/)

2. Clone the repo:
```
git clone --recurse-submodules https://github.com/Gurkengewuerz/protochat
cd protochat
```

3. Build the `bunde.js` with `npm run build`

4. Sync the builded files to iOS/Android `npm run ionic:sync`

5. Build the native apps with `ionic cap build --no-build --no-open`

6. Debug with: `npm run start`

