const API_URL = "http://localhost:3000/api/auth";

async function runTests() {
  console.log("--- Testing Auth Flows ---");
  const randomEmail = `test_${Date.now()}@example.com`;
  const password = "password123";

  // 1. Register
  console.log(`1. Registering user: ${randomEmail}`);
  const regRes = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test User", email: randomEmail, password }),
  });
  const regData = await regRes.json();
  console.log("Register response:", regData.success ? "Success" : regData);
  if (!regData.success) throw new Error("Registration failed");
  const cookieHeader = regRes.headers.get("set-cookie");
  const token = cookieHeader ? cookieHeader.split(";")[0].split("=")[1] : null;

  // 2. Login
  console.log(`2. Logging in as: ${randomEmail}`);
  const loginRes = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: randomEmail, password }),
  });
  const loginData = await loginRes.json();
  console.log("Login response:", loginData.success ? "Success" : loginData);
  if (!loginData.success) throw new Error("Login failed");

  // Extract token from cookie header
  const loginCookieHeader = loginRes.headers.get("set-cookie");
  const loginToken = loginCookieHeader ? loginCookieHeader.split(";")[0].split("=")[1] : token;

  if (!loginToken) throw new Error("No token received");

  // 3. Protected Route (/me)
  console.log(`3. Accessing protected route (/me)`);
  const meRes = await fetch(`${API_URL}/me`, {
    method: "GET",
    headers: { 
      "Authorization": `Bearer ${loginToken}`
    },
  });
  const meData = await meRes.json();
  console.log("Me response:", meData.success ? `Success (User: ${meData.data.user.email})` : meData);
  if (!meData.success) throw new Error("Me route failed");

  // 4. Logout
  console.log(`4. Logging out`);
  const logoutRes = await fetch(`${API_URL}/logout`, {
    method: "POST",
  });
  const logoutData = await logoutRes.json();
  const logoutCookie = logoutRes.headers.get("set-cookie");
  console.log("Logout response:", logoutData.success ? "Success" : logoutData);
  console.log("Logout cleared cookie:", logoutCookie?.includes("Max-Age=0") ? "Yes" : "No");

  console.log("--- All tests passed! ---");
}

runTests().catch(console.error);
