export function stringToURL(cadena: string) {
    return cadena
        .trim()
        .toLowerCase()
        .replace(/ñ/g, "n")
        .replace(/á/g, "a")
        .replace(/é/g, "e")
        .replace(/í/g, "i")
        .replace(/ó/g, "o")
        .replace(/ú/g, "u")
        .replace(/ /g, "-")
}