document.addEventListener('DOMContentLoaded', function() {
    let activeSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const editTextButton = document.getElementById('edit-text-button');
    const textInputContainer = document.getElementById('text-input-container');
    const textInput = document.getElementById('text-input');
    const fontSizeDisplay = document.getElementById('font-size-display');
    const decrementFontSizeButton = document.getElementById('decrement-font-size');
    const incrementFontSizeButton = document.getElementById('increment-font-size');
    const fontSelect = document.getElementById('font-select');
    const draggableText = document.querySelectorAll('.draggable-text');
    const prevSlideButton = document.getElementById('prev-slide');
    const nextSlideButton = document.getElementById('next-slide');
    const sliderDotsContainer = document.getElementById('slider-dots');
    
    let currentTextElement = draggableText[activeSlide];
    
    // Initial display of the first slide
    slides[activeSlide].classList.add('active');
    
    // Create slider dots
    slides.forEach((slide, index) => {
        const dot = document.createElement('div');
        dot.classList.add('slider-dot');
        if (index === activeSlide) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => showSlide(index));
        sliderDotsContainer.appendChild(dot);
    });
    const sliderDots = document.querySelectorAll('.slider-dot');
    
    // Draggable text logic
    draggableText.forEach(textElement => {
        textElement.addEventListener('mousedown', function(e) {
            let shiftX = e.clientX - textElement.getBoundingClientRect().left;
            let shiftY = e.clientY - textElement.getBoundingClientRect().top;
    
            function moveAt(pageX, pageY) {
                textElement.style.left = pageX - shiftX + 'px';
                textElement.style.top = pageY - shiftY + 'px';
            }
    
            function onMouseMove(e) {
                moveAt(e.pageX, e.pageY);
            }
    
            document.addEventListener('mousemove', onMouseMove);
    
            document.addEventListener('mouseup', function() {
                document.removeEventListener('mousemove', onMouseMove);
            }, { once: true });
        });
    });
    
    // Text input changes
    textInput.addEventListener('input', function() {
        currentTextElement.textContent = textInput.value;
    });

    // Edit text button logic
    editTextButton.addEventListener('click', function() {
        editTextButton.style.display = 'none';
        textInputContainer.style.display = 'block';
        textInput.value = currentTextElement.textContent;
        textInput.focus();
    });

    textInput.addEventListener('blur', function() {
        editTextButton.style.display = 'block';
        textInputContainer.style.display = 'none';
    });
    
    // Font size change
    decrementFontSizeButton.addEventListener('click', function() {
        let fontSize = parseInt(fontSizeDisplay.textContent);
        if (fontSize > 10) {
            fontSize--;
            fontSizeDisplay.textContent = fontSize;
            currentTextElement.style.fontSize = fontSize + 'px';
        }
    });

    incrementFontSizeButton.addEventListener('click', function() {
        let fontSize = parseInt(fontSizeDisplay.textContent);
        if (fontSize < 40) {
            fontSize++;
            fontSizeDisplay.textContent = fontSize;
            currentTextElement.style.fontSize = fontSize + 'px';
        }
    });
    
    // Font family change
    fontSelect.addEventListener('change', function() {
        currentTextElement.style.fontFamily = fontSelect.value;
    });

    // Update editor inputs based on the selected text element
    function updateEditorInputs() {
        textInput.value = currentTextElement.textContent;
        fontSizeDisplay.textContent = parseInt(window.getComputedStyle(currentTextElement).fontSize);
        fontSelect.value = window.getComputedStyle(currentTextElement).fontFamily.replace(/['"]/g, '');
    }

    // Select slide logic
    slides.forEach((slide, index) => {
        slide.addEventListener('click', function() {
            slides[activeSlide].classList.remove('active');
            sliderDots[activeSlide].classList.remove('active');
            activeSlide = index;
            slides[activeSlide].classList.add('active');
            sliderDots[activeSlide].classList.add('active');
            currentTextElement = draggableText[activeSlide];
            updateEditorInputs();
        });
    });

    // Initial update of editor inputs
    updateEditorInputs();

    // Navigation logic
    function showSlide(index) {
        slides[activeSlide].classList.remove('active');
        sliderDots[activeSlide].classList.remove('active');
        activeSlide = (index + slides.length) % slides.length;
        slides[activeSlide].classList.add('active');
        sliderDots[activeSlide].classList.add('active');
        currentTextElement = draggableText[activeSlide];
        updateEditorInputs();
    }

    prevSlideButton.addEventListener('click', function() {
        showSlide(activeSlide - 1);
    });

    nextSlideButton.addEventListener('click', function() {
        showSlide(activeSlide + 1);
    });
});