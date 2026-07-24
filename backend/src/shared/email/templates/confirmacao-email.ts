export function templateConfirmacaoEmail(logoUrl: string): string {
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="Atlas Hub" width="64" style="display:block;border:0;max-width:64px;height:auto;margin:0 auto 12px;">
       <p style="margin:0;color:#FFFFFF;font-size:22px;font-weight:bold;letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;">Atlas Hub</p>`
    : `<p style="margin:0;color:#FFFFFF;font-size:28px;font-weight:bold;letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;">Atlas Hub</p>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificação - Atlas Hub</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f6f9">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" bgcolor="#142C61" style="padding:40px 20px;">
              ${logoBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:50px 45px;color:#333333;">
              <h2 style="margin:0 0 20px;color:#142C61;font-size:28px;font-weight:bold;">
                Código de Verificação
              </h2>
              <p style="margin:0 0 25px;font-size:16px;line-height:28px;color:#333333;">
                Utilize o código abaixo para concluir sua autenticação no
                <strong>Atlas Hub</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" style="border:2px solid #CD8D00;border-radius:12px;background:#F7F8FA;">
                      <tr>
                        <td align="center" style="padding:20px 40px;color:#142C61;font-size:38px;font-weight:bold;letter-spacing:8px;font-family:Arial,Helvetica,sans-serif;">
                          {####}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:35px 0 0;font-size:15px;line-height:26px;color:#666666;">
                Se você não solicitou este código, basta ignorar este e-mail.
              </p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#142C61" align="center" style="padding:24px;">
              <p style="margin:0;color:#D4D6E0;font-size:13px;line-height:22px;">
                © 2026 Atlas Hub — Crowdfunding Imobiliário. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
