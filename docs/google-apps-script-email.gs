const SECRET_PROPERTY = "EMAIL_SHARED_SECRET";
const MAX_RECIPIENT_LENGTH = 254;

/**
 * Web App endpoint compatible with src/lib/email.server.ts.
 * Store a long random token in Apps Script > Project Settings > Script properties:
 * EMAIL_SHARED_SECRET = same value as GOOGLE_SCRIPT_EMAIL_SECRET.
 */
function doPost(event) {
  try {
    const expectedSecret = PropertiesService.getScriptProperties().getProperty(SECRET_PROPERTY);
    if (!expectedSecret) {
      console.error("Missing EMAIL_SHARED_SECRET script property.");
      return textResponse("configuration_error");
    }

    const body = JSON.parse(event.postData.contents);
    if (!body || body.secret !== expectedSecret) {
      return textResponse("unauthorized");
    }

    const to = typeof body.to === "string" ? body.to.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const text = typeof body.text === "string" ? body.text : "";
    const html = typeof body.html === "string" ? body.html : "";
    const replyTo = typeof body.replyTo === "string" ? body.replyTo.trim() : "";

    if (
      to.length === 0 ||
      to.length > MAX_RECIPIENT_LENGTH ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ||
      subject.length === 0 ||
      (!text && !html)
    ) {
      return textResponse("invalid_request");
    }

    const options = {};
    if (html) options.htmlBody = html;
    if (replyTo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
      options.replyTo = replyTo;
    }

    GmailApp.sendEmail(to, subject, text || "Consultez ce message dans un client e-mail compatible HTML.", options);
    return textResponse("ok");
  } catch (error) {
    console.error("Email delivery failed:", error && error.message ? error.message : error);
    return textResponse("send_failed");
  }
}

function textResponse(value) {
  return ContentService.createTextOutput(value).setMimeType(ContentService.MimeType.TEXT);
}
