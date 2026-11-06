# Slack Error Page

![Languages](https://img.shields.io/github/languages/count/isadfrn/slack-error-page?style=flat-square)
![Repository size](https://img.shields.io/github/repo-size/isadfrn/slack-error-page?style=flat-square)
![Last commit](https://img.shields.io/github/last-commit/isadfrn/slack-error-page?style=flat-square)

Recreation of Slack's error page, built as an HTML, CSS, and JavaScript study.

## About the Project

This project recreates the visual experience of a Slack error screen, including the illustrated scenery, the central message card, and the graphic elements used in the composition.

The goal is to practice building static interfaces, organizing styles, and positioning assets on a simple web page.

> Unofficial project, not affiliated with Slack.

## Technologies

- HTML
- CSS
- JavaScript

## Structure

```text
.
|-- assets/       # Page images and sprites
|-- css/          # Base and layout styles
|-- js/           # Page scripts (main.js: scene/animations, messages.js: error messages)
|-- index.html    # Main page
|-- LICENSE
`-- README.md
```

## How to Run

Open the `index.html` file in your browser.

You can also use a simple local server if you prefer:

```bash
npx serve .
```

## Behavior

- **Horizontal parallax:** the background (`marrakesh-meadow-80.jpg`, 6000x1000) is wider than the screen. Moving the mouse to the left or right edge pans the scene all the way to the end of the image (arrow keys work too).
- **Animals:** chickens, pigs and butterflies walk/fly across the whole image. When one leaves the image on one side, it reappears on the other. Click a chicken to make it fly.
- Respects `prefers-reduced-motion` (static scene).

## Error Messages

The message card is chosen through the query string. All messages live in `js/messages.js`:

| Parameter | Values | Default |
| --------- | ------ | ------- |
| `code`    | `400`, `401`, `403`, `404`, `408`, `410`, `429`, `500`, `502`, `503`, `504` | "You've found a Glitch!" |

Example: `index.html?code=404`

## License

[MIT](./LICENSE)
