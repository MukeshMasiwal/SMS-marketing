const API_URL = "http://localhost:3000/api";

async function runDataIsolationTest() {
  console.log("--- Starting Data Isolation Test ---");
  
  const userAEmail = `user_a_${Date.now()}@example.com`;
  const userBEmail = `user_b_${Date.now()}@example.com`;
  const password = "password123";

  // Register User A
  let res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "User A", email: userAEmail, password })
  });
  let data = await res.json();
  const tokenA = res.headers.get("set-cookie")?.split(";")[0].split("=")[1];

  // Register User B
  res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "User B", email: userBEmail, password })
  });
  data = await res.json();
  const tokenB = res.headers.get("set-cookie")?.split(";")[0].split("=")[1];

  console.log("Registered User A and User B.");

  // User A creates a contact
  res = await fetch(`${API_URL}/contacts`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenA}`
    },
    body: JSON.stringify({ name: "Contact A", phone: "+911111111111" })
  });
  data = await res.json();
  const contactId = data.data.contact._id;
  console.log(`User A created contact: ${contactId}`);

  // User B tries to get all contacts
  res = await fetch(`${API_URL}/contacts`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${tokenB}` }
  });
  data = await res.json();
  const found = data.data.contacts.find((c) => c._id === contactId);
  console.log("User B GET /api/contacts - Can see Contact A?", found ? "YES (FAIL)" : "NO (PASS)");
  if (found) throw new Error("Data isolation failed on GET all");

  // User B tries to GET specific contact
  res = await fetch(`${API_URL}/contacts/${contactId}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${tokenB}` }
  });
  console.log("User B GET /api/contacts/[id] - Status:", res.status);
  if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);

  // User B tries to PUT specific contact
  res = await fetch(`${API_URL}/contacts/${contactId}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenB}` 
    },
    body: JSON.stringify({ name: "Hacked by User B" })
  });
  console.log("User B PUT /api/contacts/[id] - Status:", res.status);
  if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);

  // User B tries to DELETE specific contact
  res = await fetch(`${API_URL}/contacts/${contactId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${tokenB}` }
  });
  console.log("User B DELETE /api/contacts/[id] - Status:", res.status);
  if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);

  // User A verifies the contact is still there and untouched
  res = await fetch(`${API_URL}/contacts/${contactId}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${tokenA}` }
  });
  data = await res.json();
  console.log("User A GET /api/contacts/[id] - Contact Name:", data.data.contact.name);
  if (data.data.contact.name !== "Contact A") throw new Error("Contact was modified by User B!");

  console.log("--- Data Isolation Test PASSED! ---");
}

runDataIsolationTest().catch(console.error);
