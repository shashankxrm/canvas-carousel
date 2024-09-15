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
    const undoButton = document.getElementById('undo-button');
    const redoButton = document.getElementById('redo-button');

    let currentTextElement = null;
    let undoStack = [];
    let redoStack = [];

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
    function makeTextBoxDraggable(textBox) {
        textBox.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Prevent default behavior

            let shiftX = e.clientX - textBox.getBoundingClientRect().left;
            let shiftY = e.clientY - textBox.getBoundingClientRect().top;

            function moveAt(pageX, pageY) {
                const slideRect = slides[activeSlide].getBoundingClientRect();
                const textBoxRect = textBox.getBoundingClientRect();

                let newLeft = pageX - shiftX;
                let newTop = pageY - shiftY;

                // Boundary checks
                if (newLeft < slideRect.left) newLeft = slideRect.left;
                if (newTop < slideRect.top) newTop = slideRect.top;
                if (newLeft + textBoxRect.width > slideRect.right) newLeft = slideRect.right - textBoxRect.width;
                if (newTop + textBoxRect.height > slideRect.bottom) newTop = slideRect.bottom - textBoxRect.height;

                textBox.style.left = newLeft - slideRect.left + 'px';  // Adjust relative to the slide
                textBox.style.top = newTop - slideRect.top + 'px';     // Adjust relative to the slide
            }

            function onMouseMove(e) {
                moveAt(e.pageX, e.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);

            document.addEventListener('mouseup', function() {
                document.removeEventListener('mousemove', onMouseMove);
                saveState(); // Save state after moving
            }, { once: true });
        });

        textBox.querySelector('.draggable-text').addEventListener('click', function() {
            currentTextElement = textBox.querySelector('.draggable-text');
            updateEditorInputs();
        });
    }

    function addTextBox(textContent = 'New Text') {
        const textBox = document.createElement('div');
        textBox.classList.add('text-box');

        const newTextElement = document.createElement('div');
        newTextElement.classList.add('draggable-text');
        newTextElement.textContent = textContent;
        textBox.appendChild(newTextElement);

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('icon', 'delete');
        deleteButton.innerHTML = '✖';
        deleteButton.addEventListener('click', function() {
            textBox.remove();
            saveState(); // Save state after deletion
        });
        textBox.appendChild(deleteButton);

        const copyButton = document.createElement('button');
        copyButton.classList.add('icon', 'copy');
        copyButton.innerHTML = '📋';
        copyButton.addEventListener('click', function() {
            navigator.clipboard.writeText(newTextElement.textContent);
        });
        textBox.appendChild(copyButton);

        // Set initial position at the center (without transform)
        textBox.style.left = '50%';
        textBox.style.top = '50%';
        textBox.style.transform = '';  // Remove any transformations
        textBox.style.position = 'absolute';  // Ensure it is positioned absolutely
        textBox.style.margin = '0';  // Reset margin

        slides[activeSlide].appendChild(textBox);
        makeTextBoxDraggable(textBox);
        currentTextElement = newTextElement;
        updateEditorInputs();
        textInputContainer.style.display = 'block';
        textInput.focus();
        saveState(); // Save state after adding
    }

    // Initialize hardcoded text boxes
    document.querySelectorAll('.text-box').forEach(textBox => {
        makeTextBoxDraggable(textBox);
        textBox.querySelector('.delete').addEventListener('click', function() {
            textBox.remove();
            saveState(); // Save state after deletion
        });
        textBox.querySelector('.copy').addEventListener('click', function() {
            navigator.clipboard.writeText(textBox.querySelector('.draggable-text').textContent);
        });

        // Position hardcoded text boxes in the middle initially
        textBox.style.left = '50%';
        textBox.style.top = '50%';
        textBox.style.transform = '';  // Remove transform for centering
    });

    // Text input changes
    textInput.addEventListener('input', function() {
        if (currentTextElement) {
            currentTextElement.textContent = textInput.value;
            saveState(); // Save state after text change
        }
    });

    textInput.addEventListener('blur', function() {
        textInputContainer.style.display = 'none';
    });

    // Add text button logic
    addTextButton.addEventListener('click', function() {
        addTextBox();
    });

    // Font size change
    decrementFontSizeButton.addEventListener('click', function() {
        if (currentTextElement) {
            let fontSize = parseInt(fontSizeDisplay.textContent);
            if (fontSize > 10) {
                fontSize--;
                fontSizeDisplay.textContent = fontSize;
                currentTextElement.style.fontSize = fontSize + 'px';
                saveState(); // Save state after font size change
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
                saveState(); // Save state after font size change
            }
        }
    });

    // Font family change
    fontSelect.addEventListener('change', function() {
        if (currentTextElement) {
            currentTextElement.style.fontFamily = fontSelect.value;
            saveState(); // Save state after font family change
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
            saveState(); // Save state after bold change
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
            saveState(); // Save state after italic change
        }
    });

    // Change text color
    colorInput.addEventListener('input', function() {
        if (currentTextElement) {
            currentTextElement.style.color = colorInput.value;
            saveState(); // Save state after color change
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

    // Save the current state for undo/redo
    function saveState() {
        const state = slides[activeSlide].innerHTML;
        undoStack.push(state);
        redoStack = []; // Clear redo stack whenever a new action is performed
    }

    // Undo the last action
    function undo() {
        if (undoStack.length > 1) {
            const currentState = undoStack.pop();
            redoStack.push(currentState);
            const previousState = undoStack[undoStack.length - 1];
            slides[activeSlide].innerHTML = previousState;
            reinitializeTextBoxes();
        }
    }

    // Redo the last undone action
    function redo() {
        if (redoStack.length > 0) {
            const nextState = redoStack.pop();
            undoStack.push(nextState);
            slides[activeSlide].innerHTML = nextState;
            reinitializeTextBoxes();
        }
    }

    // Reinitialize text boxes after undo/redo
    function reinitializeTextBoxes() {
        document.querySelectorAll('.text-box').forEach(textBox => {
            makeTextBoxDraggable(textBox);
            textBox.querySelector('.delete').addEventListener('click', function() {
                textBox.remove();
                saveState(); // Save state after deletion
            });
            textBox.querySelector('.copy').addEventListener('click', function() {
                navigator.clipboard.writeText(textBox.querySelector('.draggable-text').textContent);
            });
        });
    }

    // Add event listeners for undo and redo buttons
    undoButton.addEventListener('click', undo);
    redoButton.addEventListener('click', redo);

    // Save the initial state
    saveState();
});