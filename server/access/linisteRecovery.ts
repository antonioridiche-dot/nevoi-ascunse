export async function requestLinisteRecovery(email: string) {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error("Introdu o adresă de email validă.");
  // Domeniul expeditorului nu este verificat; nu pretindem expedierea unui link.
  return { deliveryReady: false as const };
}
