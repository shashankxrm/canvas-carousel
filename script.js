document.addEventListener('DOMContentLoaded', function() {
    let activeSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const addTextButton = document.getElementById('add-text-button');
    const textInputContainer = document.getElementById('text-input-container');
    const textInput = document.getElementById('text-input');
    const fontSizeDisplay = document.getElementById('font-size-display');
    const decrementFontSizeButton = document.getElementById('decrement-font-size');
    const incrementFontSizeButton = document.getElementById('increment-font-size');
    const fontSelect = document.getElementById('font-select');
    const prevSlideButton = document.getElementById('prev-slide');
    const nextSlideButton = document.getElementById('next-slide');
    const sliderDotsContainer = document.getElementById('slider-dots');
    const boldButton = document.getElementById('bold-button');
    const italicButton = document.getElementById('italic-button');
    const colorInput = document.getElementById('color-input');
    
    let currentTextElement = null;

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
    function makeTextDraggable(textElement) {
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

        textElement.addEventListener('click', function() {
            currentTextElement = textElement;
            updateEditorInputs();
        });
    }

    document.querySelectorAll('.draggable-text').forEach(makeTextDraggable);

    // Text input changes
    textInput.addEventListener('input', function() {
        if (currentTextElement) {
            currentTextElement.textContent = textInput.value;
        }
    });

    textInput.addEventListener('blur', function() {
        textInputContainer.style.display = 'none';
    });

    // Add text button logic
    addTextButton.addEventListener('click', function() {
        const newTextElement = document.createElement('div');
        newTextElement.classList.add('draggable-text');
        newTextElement.textContent = 'New Text';
        slides[activeSlide].appendChild(newTextElement);
        makeTextDraggable(newTextElement);
        currentTextElement = newTextElement;
        updateEditorInputs();
        textInputContainer.style.display = 'block';
        textInput.focus();
    });

    // Font size change
    decrementFontSizeButton.addEventListener('click', function() {
        if (currentTextElement) {
            let fontSize = parseInt(fontSizeDisplay.textContent);
            if (fontSize > 10) {
                fontSize--;
                fontSizeDisplay.textContent = fontSize;
                currentTextElement.style.fontSize = fontSize + 'px';
            }
        }
    });

    incrementFontSizeButton.addEventListener('click', function() {
        if (currentTextElement) {
            let fontSize = parseInt(fontSizeDisplay.textContent);
            if (fontSize < 40) {
                fontSize++;
                fontSizeDisplay.textContent = fontSize;
                currentTextElement.style.fontSize = fontSize + 'px';
            }
        }
    });

    // Font family change
    fontSelect.addEventListener('change', function() {
        if (currentTextElement) {
            currentTextElement.style.fontFamily = fontSelect.value;
        }
    });

    // Bold text
    boldButton.addEventListener('click', function() {
        if (currentTextElement) {
            if (currentTextElement.style.fontWeight === 'bold') {
                currentTextElement.style.fontWeight = 'normal';
            } else {
                currentTextElement.style.fontWeight = 'bold';
            }
        }
    });

    // Italic text
    italicButton.addEventListener('click', function() {
        if (currentTextElement) {
            if (currentTextElement.style.fontStyle === 'italic') {
                currentTextElement.style.fontStyle = 'normal';
            } else {
                currentTextElement.style.fontStyle = 'italic';
            }
        }
    });

    // Change text color
    colorInput.addEventListener('input', function() {
        if (currentTextElement) {
            currentTextElement.style.color = colorInput.value;
        }
    });

    // Update editor inputs based on the selected text element
    function updateEditorInputs() {
        if (currentTextElement) {
            textInput.value = currentTextElement.textContent;
            fontSizeDisplay.textContent = parseInt(window.getComputedStyle(currentTextElement).fontSize);
            fontSelect.value = window.getComputedStyle(currentTextElement).fontFamily.replace(/['"]/g, '');
            colorInput.value = window.getComputedStyle(currentTextElement).color;
            textInputContainer.style.display = 'block';
        } else {
            textInputContainer.style.display = 'none';
        }
    }

    // Select slide logic
    function showSlide(index) {
        slides[activeSlide].classList.remove('active');
        sliderDots[activeSlide].classList.remove('active');
        activeSlide = (index + slides.length) % slides.length;
        slides[activeSlide].classList.add('active');
        sliderDots[activeSlide].classList.add('active');
        currentTextElement = null;
        updateEditorInputs();
    }

    prevSlideButton.addEventListener('click', function() {
        showSlide(activeSlide - 1);
    });

    nextSlideButton.addEventListener('click', function() {
        showSlide(activeSlide + 1);
    });
});