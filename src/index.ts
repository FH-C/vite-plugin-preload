const fs = require("fs");
const path = require("path");

const fileList = new Set<string>();

const getSubDirectory = (_path: string) => {
  if (fs.lstatSync(_path).isDirectory()) {
    const files = fs.readdirSync(_path);
    files.forEach((file: string) => {
      getSubDirectory(path.resolve(_path, file));
    });
  } else if (fs.lstatSync(_path).isFile()) {
    fileList.add(_path.replace(path.resolve(process.cwd(), "src"), ""));
  }
};

const filter = (fileExtensionsReg: RegExp[]) => {
  fileList.forEach((file) => {
    for (const [index, reg] of fileExtensionsReg.entries()) {
      if (reg.test(file)) break;
      if (index === fileExtensionsReg.length - 1) fileList.delete(file);
    }
  });
};

export default (
  paths: string[],
  fileExtensionsReg: RegExp[],
  timeout = 2000
) => ({
  name: "vite-plugin-preload",
  transform(code: string, id: string) {
    if (id.includes("src/index.ts")) {
      paths.forEach((_path) => {
        getSubDirectory(path.resolve(process.cwd(), _path));
      });
      filter(fileExtensionsReg);
      return `
          ${code};
          window.onload = () => {
              const lazyPages = ${JSON.stringify(Array.from(fileList))};
              setTimeout(() => {
                lazyPages.forEach(item => fetch(item));
              }, ${timeout});
          }
      `;
    }
    return code;
  },
});
