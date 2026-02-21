import Mailjet from "node-mailjet";

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC!,
  process.env.MJ_APIKEY_PRIVATE!,
);

const FROM_EMAIL = process.env.MJ_FROM_EMAIL || "no-reply@pyoratori.com";
const FROM_NAME = "Pyörätori";
const BASE_URL = process.env.AUTH_URL || "http://localhost:3000";

async function sendEmail(to: { email: string; name: string }, subject: string, textPart: string, htmlPart: string) {
  await mailjet
    .post("send", { version: "v3.1" })
    .request({
      Messages: [
        {
          From: { Email: FROM_EMAIL, Name: FROM_NAME },
          To: [{ Email: to.email, Name: to.name }],
          Subject: subject,
          TextPart: textPart,
          HTMLPart: htmlPart,
        },
      ],
    });
}

export async function sendActivationEmail(email: string, name: string, token: string) {
  const url = `${BASE_URL}/aktivoi?token=${token}`;

  await sendEmail(
    { email, name },
    "Aktivoi tilisi – Pyörätori",
    `Hei ${name},\n\nAktivoi tilisi klikkaamalla seuraavaa linkkiä:\n${url}\n\nLinkki on voimassa 24 tuntia.\n\nJos et luonut tiliä Pyörätorille, voit jättää tämän viestin huomiotta.\n\n– Pyörätori`,
    `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Tervetuloa Pyörätorille!</h2>
  <p>Hei ${name},</p>
  <p>Aktivoi tilisi klikkaamalla alla olevaa painiketta:</p>
  <p style="margin: 24px 0;">
    <a href="${url}" style="background-color: #18181b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Aktivoi tili</a>
  </p>
  <p style="color: #666; font-size: 14px;">Linkki on voimassa 24 tuntia.</p>
  <p style="color: #666; font-size: 14px;">Jos et luonut tiliä Pyörätorille, voit jättää tämän viestin huomiotta.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #999; font-size: 12px;">Pyörätori</p>
</div>`,
  );
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const url = `${BASE_URL}/unohtunut-salasana?token=${token}`;

  await sendEmail(
    { email, name },
    "Salasanan vaihto – Pyörätori",
    `Hei ${name},\n\nVaihda salasanasi klikkaamalla seuraavaa linkkiä:\n${url}\n\nLinkki on voimassa 1 tunnin.\n\nJos et pyytänyt salasanan vaihtoa, voit jättää tämän viestin huomiotta.\n\n– Pyörätori`,
    `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Salasanan vaihto</h2>
  <p>Hei ${name},</p>
  <p>Vaihda salasanasi klikkaamalla alla olevaa painiketta:</p>
  <p style="margin: 24px 0;">
    <a href="${url}" style="background-color: #18181b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Vaihda salasana</a>
  </p>
  <p style="color: #666; font-size: 14px;">Linkki on voimassa 1 tunnin.</p>
  <p style="color: #666; font-size: 14px;">Jos et pyytänyt salasanan vaihtoa, voit jättää tämän viestin huomiotta.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #999; font-size: 12px;">Pyörätori</p>
</div>`,
  );
}
