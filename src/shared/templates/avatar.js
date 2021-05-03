import { html } from 'lit-html';

const getImgHref = (image, image_type, o) => {
    console.log(`o`, o);
    return image.startsWith('data:') ? image : `data:${image_type};base64,${image}`;
};

export default o => {
    if (o.image) {
        return html`
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="avatar rounded-circle ${o.classes}"
                width="${o.width}"
                height="${o.height}"
            >
                <image
                    width="${o.width}"
                    height="${o.height}"
                    preserveAspectRatio="xMidYMid meet"
                    href="${getImgHref(o.image, o.image_type, o)}"
                />
            </svg>
        `;
    } else {
        return '';
    }
};
