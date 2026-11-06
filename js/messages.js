/**
 * Error message catalog.
 *
 * ERROR_MESSAGES[code] = { title, text, actions }
 *  - "default" is used when no code is given or the code is unknown.
 *  - actions: { type: "back" | "reload" | "link", label, href? }
 *    The first action is the primary button (purple); the rest are secondary.
 *    An empty list shows no buttons.
 *
 * Usage: index.html?code=404
 */
(function () {
  "use strict";

  const HELP_URL = "https://slack.com/help";
  const SIGNIN_URL = "https://slack.com/signin";
  const STATUS_URL = "https://status.slack.com";

  const back = { type: "back", label: "Go back" };
  const reload = { type: "reload", label: "Try again" };
  const help = { type: "link", label: "Help Center", href: HELP_URL };
  const status = { type: "link", label: "Slack status", href: STATUS_URL };

  window.ERROR_MESSAGES = {
    default: {
      title: "You've found a Glitch!",
      text: "You've found yourself in a weird place.\nProbably not the place you were looking for. ¯\\_(ツ)_/¯",
      actions: [],
    },
    400: {
      title: "That request didn't make sense…",
      text: "Something got scrambled on the way here and we couldn't understand what you asked for. Go back and give it another try.",
      actions: [back, help],
    },
    401: {
      title: "Hold on, who goes there?",
      text: "You need to sign in to see this page. Sign in to your workspace and we'll take you right back.",
      actions: [{ type: "link", label: "Sign in", href: SIGNIN_URL }, back],
    },
    403: {
      title: "This area is off limits…",
      text: "You don't have permission to view this page. If you think that's a mistake, ask a workspace admin to let you in.",
      actions: [back, help],
    },
    404: {
      title: "We couldn't find that page…",
      text: "The page you're looking for may have been moved, deleted, or may never have existed. Double-check the address, or head back the way you came.",
      actions: [back, help],
    },
    408: {
      title: "That took too long…",
      text: "The connection timed out before we could finish. Check your internet connection and try again.",
      actions: [reload, back],
    },
    410: {
      title: "This page is gone for good…",
      text: "What you're looking for was removed and isn't coming back. You can go back, or look around our Help Center for something similar.",
      actions: [back, help],
    },
    429: {
      title: "Whoa, slow down a little…",
      text: "You've made a lot of requests in a short time. Take a breath, wait a minute, and try again.",
      actions: [reload, back],
    },
    500: {
      title: "Something broke on our end…",
      text: "It's not you, it's us. Our team has been notified and is already on it. Give it a few minutes and try again.",
      actions: [reload, status],
    },
    502: {
      title: "We got a garbled reply…",
      text: "One of our servers sent back something we couldn't understand. This is usually temporary, so try again in a moment.",
      actions: [reload, status],
    },
    503: {
      title: "We're taking a quick break…",
      text: "Slack is temporarily unavailable, most likely for maintenance. We'll be back shortly, so check our status page for updates.",
      actions: [status, reload],
    },
    504: {
      title: "The server took too long to answer…",
      text: "We were waiting for a response that never came. Check your connection and try again in a few moments.",
      actions: [reload, status],
    },
  };
})();
