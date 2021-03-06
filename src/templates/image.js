import { html } from "lit-html";
import { renderImage } from "shared/directives/image.js";

export default (o) => html`${renderImage(o.url, o.url, o.onLoad, o.onClick)}`;
