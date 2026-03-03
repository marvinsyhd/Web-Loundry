function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  const users = [
    { username: "admin", password: "123", role: "Admin" },
    { username: "kasir", password: "123", role: "Kasir" }
  ];

  const found = users.find(
    u => u.username === user && u.password === pass
  );

  if (found) {
    localStorage.setItem("isLogin", "true");
    localStorage.setItem("role", found.role);
    localStorage.setItem("username", found.username);
    window.location.href = "app.html";
  } else {
    document.getElementById("error").innerText =
      "Login salah";
  }
}