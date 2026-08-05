export function teamIsPC(department?: string): boolean {
  if (!department) return true;
  const d = department.toLowerCase();
  return (
    department === "pc" ||
    d.includes("protección") ||
    d.includes("proteccion")
  );
}

export function teamIsBomberos(department?: string): boolean {
  if (!department) return false;
  const d = department.toLowerCase();
  return department === "bomberos" || d.includes("bombero");
}
