class GiftGuideManager {
    constructor() {
        this.popup = document.getElementById('ProductPopup');
        this.popupContent = this.popup?.querySelector('.popup-inner-content');
        this.closeButton = this.popup?.querySelector('.popup-close-button');
        this.productCards = document.querySelectorAll('.product-card');

        this.productCards.forEach(card => {
            card.addEventListener('click', this.openPopup.bind(this));
        });

        this.closeButton?.addEventListener('click', this.closePopup.bind(this));
        this.popup?.addEventListener('click', (event) => {
            if (event.target === this.popup) {
                this.closePopup();
            }
        });
    }

    async openPopup(event) {
        if (!this.popup || !this.popupContent) return;
        const productHandle = event.currentTarget.dataset.productHandle;
        try {
            const response = await fetch(`/products/${productHandle}.json`);
            const product = await response.json();
            this.renderPopupContent(product);
            this.popup.classList.add('active');
        } catch (error) {
            console.error('Error fetching product:', error);
        }
    }

    closePopup() {
        this.popup?.classList.remove('active');
        if (this.popupContent) this.popupContent.innerHTML = '';
    }

    renderPopupContent(product) {
        if (!this.popupContent) return;

        let variantOptionsHTML = '';
        if (product.variants.length > 1) {
            product.options.forEach((option, index) => {
                variantOptionsHTML += `
                    <div class="variant-selector">
                        <label for="option-${index}">${option.name}</label>
                        <select id="option-${index}" name="options[${option.name}]">
                            ${product.variants.map(variant => `<option value="${variant.options[index]}">${variant.options[index]}</option>`).filter((value, index, self) => self.indexOf(value) === index).join('')}
                        </select>
                    </div>
                `;
            });
        }
        this.popupContent.innerHTML = `
            <div class="popup-grid">
                <div class="popup-image-container">
                    <img src="${product.featured_image.src}" alt="${product.title}">
                </div>
                <div class="popup-details">
                    <h2 class="popup-product-title">${product.title}</h2>
                    <div class="popup-price-container">
                        <span class="popup-product-price">${Shopify.formatMoney(product.price)}</span>
                    </div>
                    <div class="popup-product-description">${product.description}</div>
                    <form action="/cart/add" method="post" enctype="multipart/form-data" class="popup-product-form">
                        ${variantOptionsHTML}
                        <div class="quantity-selector">
                            <label for="quantity">Quantity</label>
                            <input type="number" id="quantity" name="quantity" value="1" min="1">
                        </div>
                        <button type="submit">Add to cart</button>
                    </form>
                </div>
            </div>
        `;

        const form = this.popupContent.querySelector('.popup-product-form');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            let variantId;
            if(product.variants.length > 1){
                 const selectedOptions = product.options.map((option, index) => formData.get(`options[${option.name}]`));
                 const selectedVariant = product.variants.find(variant => {
                    return variant.options.every((optionValue, index) => optionValue === selectedOptions[index]);
                 });
                 variantId = selectedVariant.id;
            } else {
                variantId = product.variants[0].id;
            }

            const quantity = formData.get('quantity');
            this.addToCart(variantId, quantity);
        });
    }

    async addToCart(variantId, quantity) { // Removed product parameter
        try {
            const response = await fetch('/cart/add.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity, id: variantId })
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.description || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert(error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GiftGuideManager();
});