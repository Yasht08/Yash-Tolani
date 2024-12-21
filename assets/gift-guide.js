class GiftGuideManager {
    constructor() {
      this.popup = document.getElementById('ProductPopup');
      this.popupContent = document.getElementById('ProductPopupContent');
      this.winterJacketId = 'your-winter-jacket-id'; // Replace with actual product ID
      
      this.init();
    }
  
    init() {
      this.bindEvents();
    }
  
    bindEvents() {
      // Quick view buttons
      document.querySelectorAll('.quick-view-button').forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const productId = button.dataset.productId;
          this.openQuickView(productId);
        });
      });
  
      // Close popup
      document.querySelector('.popup-close-button').addEventListener('click', () => {
        this.closePopup();
      });
  
      // Close on outside click
      this.popup.addEventListener('click', (e) => {
        if (e.target === this.popup) {
          this.closePopup();
        }
      });
  
      // Add to cart form submission
      document.querySelector('.popup-product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddToCart(e.target);
      });
    }
  
    async openQuickView(productId) {
      try {
        const response = await fetch(`/products/${productId}.js`);
        const product = await response.json();
        
        this.renderProductPopup(product);
        this.popup.classList.add('active');
        this.popupContent.style.display = 'block';
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    }
  
    renderProductPopup(product) {
      // Update popup content
      const popupImage = document.querySelector('.popup-product-image');
      const popupTitle = document.querySelector('.popup-product-title');
      const popupPrice = document.querySelector('.popup-product-price');
      const popupDescription = document.querySelector('.popup-product-description');
      const variantSelects = document.querySelector('.popup-variant-selects');
  
      popupImage.src = product.featured_image;
      popupImage.alt = product.title;
      popupTitle.textContent = product.title;
      popupPrice.textContent = this.formatMoney(product.price);
      popupDescription.innerHTML = product.description;
  
      // Clear existing variant selects
      variantSelects.innerHTML = '';
  
      // Create variant selection dropdowns
      product.options_with_values.forEach((option, index) => {
        const select = this.createVariantSelect(option, index);
        variantSelects.appendChild(select);
      });
  
      // Store product data for later use
      this.popupContent.dataset.productId = product.id;
      this.currentVariants = product.variants;
    }
  
    createVariantSelect(option, index) {
      const container = document.createElement('div');
      container.className = 'variant-select-container';
  
      const label = document.createElement('label');
      label.textContent = option.name;
      label.htmlFor = `option${index}`;
  
      const select = document.createElement('select');
      select.id = `option${index}`;
      select.className = 'variant-select';
      select.name = `option${index + 1}`;
  
      option.values.forEach(value => {
        const optionElement = document.createElement('option');
        optionElement.value = value;
        optionElement.textContent = value;
        select.appendChild(optionElement);
      });
  
      container.appendChild(label);
      container.appendChild(select);
  
      return container;
    }
  
    async handleAddToCart(form) {
      const button = form.querySelector('.add-to-cart-button');
      const buttonText = button.querySelector('.button-text');
      const spinner = button.querySelector('.loading-spinner');
  
      // Get selected variant
      const selectedOptions = Array.from(form.querySelectorAll('.variant-select')).map(select => select.value);
      const selectedVariant = this.findVariant(selectedOptions);
  
      if (!selectedVariant) {
        alert('Selected variant is not available');
        return;
      }
  
      // Show loading state
      buttonText.style.opacity = '0';
      spinner.style.display = 'block';
      button.disabled = true;
  
      try {
        // Add selected product to cart
        await this.addToCart(selectedVariant.id, form.querySelector('#Quantity').value);
  
        // Check if we need to add the winter jacket
        if (this.shouldAddWinterJacket(selectedVariant)) {
          await this.addToCart(this.winterJacketId, 1);
        }
  
        // Show success message
        buttonText.textContent = 'Added to Cart!';
        setTimeout(() => {
          this.closePopup();
          buttonText.textContent = 'Add to Cart';
        }, 2000);
      } catch (error) {
        console.error('Error adding to cart:', error);
        buttonText.textContent = 'Error - Try Again';
      } finally {
        buttonText.style.opacity = '1';
        spinner.style.display = 'none';
        button.disabled = false;
      }
    }
  
    shouldAddWinterJacket(variant) {
      // Check if variant has Black and Medium options
      return variant.options.includes('Black') && variant.options.includes('Medium');
    }
  
    async addToCart(variantId, quantity) {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: variantId,
            quantity: parseInt(quantity, 10)
          }]
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }
  
      return response.json();
    }
  
    findVariant(selectedOptions) {
      return this.currentVariants.find(variant => {
        return variant.options.every((option, index) => option === selectedOptions[index]);
      });
    }
  
    formatMoney(cents) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(cents / 100);
    }
  
    closePopup() {
      this.popup.classList.remove('active');
      this.popupContent.style.display = 'none';
    }
  }
  
  // Initialize the Gift Guide when the DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new GiftGuideManager();
  });