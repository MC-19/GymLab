export function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/s$/, ""); // Simple singularization
}
