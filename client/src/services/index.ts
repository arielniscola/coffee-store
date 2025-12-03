export const unauthorized = () => {
  localStorage.removeItem("token");
  window.location.href = "/access-denied";
};
