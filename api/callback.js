export default async function handler(req, res) {
  const code = req.query.code;
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;

  if (!code) {
    return res.status(400).send("Falta el código de autorización.");
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
      }),
    });

    const data = await response.json();

    if (data.error || !data.access_token) {
      return res.status(400).send(`Error de GitHub: ${data.error_description || JSON.stringify(data)}`);
    }

    const token = data.access_token;
    const provider = 'github';

    // Script HTML para enviar el token a la ventana padre (Decap CMS) y cerrar la emergente
    const responseBody = `
      <!DOCTYPE html>
      <html>
      <body>
        <script>
          (function() {
            function recieveMessage(e) {
              console.log("Obtenido mensaje:", e);
              window.opener.postMessage(
                'authorization:github:success:${JSON.stringify({ token, provider })}',
                e.origin
              );
            }
            window.addEventListener("message", recieveMessage, false);
            window.opener.postMessage("authorizing:github", "*");
          })();
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(responseBody);
  } catch (error) {
    return res.status(500).send(`Error en el servidor: ${error.message}`);
  }
}