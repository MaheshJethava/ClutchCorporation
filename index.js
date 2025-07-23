

import KeyAuth from "./keyauth-web.js";

const KeyAuthApp = new KeyAuth({
  name: "WebTest",             // your app name in KeyAuth
  ownerid: "7hglp2IAKQ",        // your owner ID
  version: "1.0"                // your app version
});

window.handleLogin = async function () {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("error-msg");
  errorMsg.innerText = "";

  if (!username || !password) {
    errorMsg.innerText = "Please enter username and password.";
    return;
  }

  try {
    await KeyAuthApp.init();
    await KeyAuthApp.login(username, password);
    localStorage.setItem("loggedIn", "true");
   localStorage.setItem("userData", JSON.stringify(KeyAuthApp.user_data));
    localStorage.setItem("appData", JSON.stringify(KeyAuthApp.app_data));
    window.location.href = "dashboard.html";
  } catch (err) {
    errorMsg.innerText = err.message;
  }
};




async function answer() {
  try {
    await KeyAuthApp.init()

    console.log("[1] Login\n[2] Register")

    const optionRaw = await readline.question("Select an option: ")
    const option = parseInt(optionRaw)

    let username = "",
      password = "",
      license = ""

    switch (option) {
      case 1:
        username = await readline.question("Username: ")
        password = await readline.question("Password: ")
        await KeyAuthApp.login(username, password)
        dashboard()
        break

      case 2:
        username = await readline.question("Username: ")
        password = await readline.question("Password: ")
        license = await readline.question("License: ")
        await KeyAuthApp.register(username, password, license)
        dashboard()
        break

      case 3:
        license = await readline.question("License: ")
        await KeyAuthApp.license(license)
        dashboard()
        break

      case 4:
        username = await readline.question("Username: ")
        license = await readline.question("License: ")
        await KeyAuthApp.upgrade(username, license)
        dashboard()
        break

      default:
        console.log("Invalid option selected.")
        break
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("An error occurred:", error.message)
    } else {
      console.error("An unknown error occurred:", error)
    }
  }
}

answer()

async function dashboard() {
  await KeyAuthApp.fetchStats()
  console.log("Application data:")
  console.log("  App Version: ", KeyAuthApp.app_data?.app_ver)
  console.log("  Customer panel: ", KeyAuthApp.app_data?.customer_panel)
  console.log("  Number of Keys: ", KeyAuthApp.app_data?.numKeys)
  console.log("  Number of Users: ", KeyAuthApp.app_data?.numUsers)
  console.log("  Online Users: ", KeyAuthApp.app_data?.onlineUsers)

  console.log("\nUser data:")
  console.log("  Username: ", KeyAuthApp.user_data?.username)
  console.log("  IP Address: ", KeyAuthApp.user_data?.ip)
  console.log("  Hardware-id: ", KeyAuthApp.user_data?.hwid)

  const subs = KeyAuthApp.user_data?.subscriptions || []

  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i]
    const expiry = new Date(Number(sub.expiry) * 1000)

    console.log(
      `[${i + 1}/${subs.length}] | Subscription: ${
        sub.subscription
      } - Expiry: ${expiry.toLocaleString()}`
    )
  }

  console.log(
    `Created at: ${new Date(
      (KeyAuthApp.user_data?.createdate || 0) * 1000
    ).toLocaleString()}`
  )
  console.log(
    `Last Login: ${new Date(
      (KeyAuthApp.user_data?.lastlogin || 0) * 1000
    ).toLocaleString()}`
  )
  console.log(
    `Expires: ${new Date(
      (KeyAuthApp.user_data?.expires || 0) * 1000
    ).toLocaleString()}`
  )

  console.log("\n2-factor authentication:")
  console.log("[1] Enable\n[2] Disable")

  const optionRaw = await readline.question("Select an option: ")
  const option = parseInt(optionRaw)

  switch (option) {
    case 1:
      await KeyAuthApp.enable2fa()
      break
    case 2:
      await KeyAuthApp.disable2fa()
      break
    default:
      console.log("Invalid option selected.")
      break
  }

  console.log("Closing app in 10 seconds...")
  await new Promise(resolve => setTimeout(resolve, 10000))
  readline.close()
  await KeyAuthApp.logout()
  process.exit(0)
}