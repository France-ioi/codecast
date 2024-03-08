const assetsBasePath = (window.localModulesPath ?? window.modulesPath);

export function getTralalereImg(filename: string): string {
    return assetsBasePath + 'img/algorea/crane/' + filename;
}