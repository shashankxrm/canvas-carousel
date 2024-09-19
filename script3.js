import { db, collection, getDocs, doc, setDoc, deleteDoc } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', function () {
    let activeSlide = 0;
    let currentTextElement = null;
    let slidesData = [];
    let undoStack = [];
    let redoStack = [];

   const carousel = document.getElementById('carousel');
    const newSlideButton = document.getElementById('new-slide-button'); 
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
    const underlineButton = document.getElementById('underline-button');
    const strikethroughButton = document.getElementById('strikethrough-button');
    const colorInput = document.getElementById('color-input');
    const slideList = document.getElementById('slide-list');
    const saveOrderButton = document.getElementById('save-order-button');
    const cancelOrderButton = document.getElementById('cancel-order-button');
    const slideOrderEditorDialog = document.getElementById('slide-order-editor-dialog');
    const openSlideOrderEditorButton = document.getElementById('open-slide-order-editor');

    // Fetch slides from Firestore
    async function fetchSlides() {
        slidesData = [];
        const slidesCollection = collection(db, 'slides');
        const snapshot = await getDocs(slidesCollection);
        snapshot.forEach(doc => {
            slidesData.push({ id: doc.id, ...doc.data() });
        });
        return slidesData;
    }

    // Save slide data to Firestore
    async function saveSlide(slide) {
        const slideRef = doc(db, 'slides', slide.id);
        await setDoc(slideRef, slide);
    }

    // Delete slide from Firestore
    async function deleteSlide(slideId) {
        const slideRef = doc(db, 'slides', slideId);
        await deleteDoc(slideRef);
    }

    // New Slide function
    function newSlide() {
        const slideId = `slide-${Date.now()}`; // Generate a unique ID for the slide
        const newSlide = {
            id: slideId,
            text: 'New Text',
            imageUrl: './assets/default.jpg',  // Default background image
            textBoxLeft: '50%',
            textBoxTop: '50%'
        };

        // Save the new slide to Firestore
        saveSlide(newSlide);

        // Re-render the carousel to include the new slide
        renderCarousel();
    }

    // Render the carousel
    async function renderCarousel() {
        carousel.innerHTML = ''; // Clear existing slides
        const slidesData = await fetchSlides();
        // Sort slidesData based on the order property
        slidesData.sort((a, b) => a.order - b.order);

        slidesData.forEach(slide => {
            const slideElement = document.createElement('div');
            slideElement.className = 'slide';
            slideElement.style.backgroundImage = `url('${slide.imageUrl}')`;
            slideElement.dataset.id = slide.id;

            const textBox = document.createElement('div');
            textBox.className = 'text-box';
            textBox.style.left = slide.textBoxLeft || '50%';
            textBox.style.top = slide.textBoxTop || '50%';

            const draggableText = document.createElement('div');
            draggableText.className = 'draggable-text';
            draggableText.id = slide.id;
            draggableText.textContent = slide.text;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'icon delete';
            deleteButton.title = 'Delete';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.addEventListener('click', function () {
                deleteSlide(slide.id);
                slideElement.remove();
            });

            const copyButton = document.createElement('button');
            copyButton.className = 'icon copy';
            copyButton.title = 'Copy';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';

            textBox.appendChild(draggableText);
            textBox.appendChild(deleteButton);
            textBox.appendChild(copyButton);

            slideElement.appendChild(textBox);
            carousel.appendChild(slideElement);
            // Make the text box draggable
            makeTextBoxDraggable(textBox);
        });

        // Reinitialize slides and other elements
        initializeSlides();
    }

    // Function to initialize slides and other elements
    function initializeSlides() {
        const slides = document.querySelectorAll('.slide');
        sliderDotsContainer.innerHTML = ''; // Clear existing dots

        // Initial display of the first slide
        if (slides.length > 0) {
            slides[activeSlide].classList.add('active');
        }

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

        // Function to select slide logic
        function showSlide(index) {
            if (slides.length > 0) {
                slides[activeSlide].classList.remove('active');
                sliderDots[activeSlide].classList.remove('active');
                activeSlide = (index + slides.length) % slides.length;
                slides[activeSlide].classList.add('active');
                sliderDots[activeSlide].classList.add('active');
                currentTextElement = null;
                updateEditorInputs();
            }
        }

        prevSlideButton.addEventListener('click', function () {
            showSlide(activeSlide - 1);
        });

        nextSlideButton.addEventListener('click', function () {
            showSlide(activeSlide + 1);
        });
    }

   // Make a text box draggable
    function makeTextBoxDraggable(textBox) {
        textBox.addEventListener('mousedown', function (e) {
            e.preventDefault();

            let shiftX = e.clientX - textBox.getBoundingClientRect().left;
            let shiftY = e.clientY - textBox.getBoundingClientRect().top;

            function moveAt(pageX, pageY) {
                const slideRect = document.querySelector('.slide.active').getBoundingClientRect();
                const textBoxRect = textBox.getBoundingClientRect();

                let newLeft = pageX - shiftX;
                let newTop = pageY - shiftY;

                // Boundary checks
                if (newLeft < slideRect.left) newLeft = slideRect.left;
                if (newTop < slideRect.top) newTop = slideRect.top;
                if (newLeft + textBoxRect.width > slideRect.right) newLeft = slideRect.right - textBoxRect.width;
                if (newTop + textBoxRect.height > slideRect.bottom) newTop = slideRect.bottom - textBoxRect.height;

                textBox.style.left = newLeft - slideRect.left + 'px';
                textBox.style.top = newTop - slideRect.top + 'px';
            }

            function onMouseMove(e) {
                moveAt(e.pageX, e.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);

            document.addEventListener('mouseup', function () {
                document.removeEventListener('mousemove', onMouseMove);
                saveState(); // Save state after moving
            }, { once: true });
        });

        textBox.querySelector('.draggable-text').addEventListener('click', function () {
            currentTextElement = textBox.querySelector('.draggable-text');
            updateEditorInputs();
            selectTextBox(textBox);
        });
    }
    // Function to select a text box and deselect others
    function selectTextBox(textBox) {
        document.querySelectorAll('.text-box').forEach(box => {
            box.classList.remove('selected');
        });
        textBox.classList.add('selected');
    }



    function addTextBox(textContent = 'New Text') {
        const newSlideId = `slide-${Date.now()}`;
        const textBox = document.createElement('div');
        textBox.classList.add('text-box');

        const newTextElement = document.createElement('div');
        newTextElement.classList.add('draggable-text');
        newTextElement.textContent = textContent;
        textBox.appendChild(newTextElement);

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('icon', 'delete');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.addEventListener('click', function () {
            textBox.remove();
            saveState(); // Save state after deletion
        });
        textBox.appendChild(deleteButton);

        const copyButton = document.createElement('button');
        copyButton.classList.add('icon', 'copy');
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.addEventListener('click', function () {
            navigator.clipboard.writeText(newTextElement.textContent);
        });
        textBox.appendChild(copyButton);

        // Set initial position at the center
        textBox.style.left = '50%';
        textBox.style.top = '50%';
        textBox.style.position = 'absolute';
        textBox.style.margin = '0';

        document.querySelector('.slide.active').appendChild(textBox);
        makeTextBoxDraggable(textBox);
        currentTextElement = newTextElement;
        updateEditorInputs();
        textInputContainer.style.display = 'block';
        textInput.focus();

        // Save new slide to Firestore
        const slideData = {
            id: newSlideId,
            text: textContent,
            imageUrl: './assets/default.jpg',
            textBoxLeft: '50%',
            textBoxTop: '50%'
        };
        saveSlide(slideData);
        saveState(); // Save state after adding
    }

    // Text input changes
    textInput.addEventListener('input', function () {
        if (currentTextElement) {
            currentTextElement.textContent = textInput.value;
            saveState(); // Save state after text change
        }
    });

    textInput.addEventListener('blur', function () {
        textInputContainer.style.display = 'none';
    });

    // Add text button logic
    addTextButton.addEventListener('click', function () {
        addTextBox();
    });

    // Font size change
    decrementFontSizeButton.addEventListener('click', function () {
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

    incrementFontSizeButton.addEventListener('click', function () {
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
    fontSelect.addEventListener('change', function () {
        if (currentTextElement) {
            currentTextElement.style.fontFamily = fontSelect.value;
            saveState(); // Save state after font family change
        }
    });

    // Bold text
    boldButton.addEventListener('click', function () {
        if (currentTextElement) {
            if (currentTextElement.style.fontWeight === 'bold') {
                currentTextElement.style.fontWeight = 'normal';
                boldButton.classList.remove('active');
            } else {
                currentTextElement.style.fontWeight = 'bold';
                boldButton.classList.add('active');
            }
            saveState(); // Save state after bold change
        }
    });

    // Italic text
    italicButton.addEventListener('click', function () {
        if (currentTextElement) {
            if (currentTextElement.style.fontStyle === 'italic') {
                currentTextElement.style.fontStyle = 'normal';
                italicButton.classList.remove('active');
            } else {
                currentTextElement.style.fontStyle = 'italic';
                italicButton.classList.add('active');
            }
            saveState(); // Save state after italic change
        }
    });

    // Underline text
    underlineButton.addEventListener('click', function () {
        if (currentTextElement) {
            if (currentTextElement.style.textDecoration === 'underline') {
                currentTextElement.style.textDecoration = 'none';
                underlineButton.classList.remove('active');
            } else {
                currentTextElement.style.textDecoration = 'underline';
                underlineButton.classList.add('active');
            }
            saveState(); // Save state after underline change
        }
    });

    // Strikethrough text
    strikethroughButton.addEventListener('click', function () {
        if (currentTextElement) {
            if (currentTextElement.style.textDecoration === 'line-through') {
                currentTextElement.style.textDecoration = 'none';
                strikethroughButton.classList.remove('active');
            } else {
                currentTextElement.style.textDecoration = 'line-through';
                strikethroughButton.classList.add('active');
            }
            saveState(); // Save state after strikethrough change
        }
    });

    // Change text color
    colorInput.addEventListener('input', function () {
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
            fontSelect.value = "";
            colorInput.value = window.getComputedStyle(currentTextElement).color;

            // Update button active states
            boldButton.classList.toggle('active', currentTextElement.style.fontWeight === 'bold');
            italicButton.classList.toggle('active', currentTextElement.style.fontStyle === 'italic');
            underlineButton.classList.toggle('active', currentTextElement.style.textDecoration === 'underline');
            strikethroughButton.classList.toggle('active', currentTextElement.style.textDecoration === 'line-through');

            textInputContainer.style.display = 'block';
        } else {
            textInputContainer.style.display = 'none';
            fontSelect.value = "";  // Reset to placeholder
        }
    }

    // Save the current state for undo/redo
    function saveState() {
        const activeSlideElement = document.querySelector('.slide.active');
        const slideId = activeSlideElement.dataset.id;
        if (activeSlideElement) {
            const slideData = {
                id: slideId,
                text: activeSlideElement.querySelector('.draggable-text').textContent,
                imageUrl: activeSlideElement.style.backgroundImage,
                textBoxLeft: activeSlideElement.querySelector('.text-box').style.left,
                textBoxTop: activeSlideElement.querySelector('.text-box').style.top
            };
            saveSlide(slideData); // Save slide state to Firestore
        }
    }


   // Slide Order Editor
    function renderSlideList() {
        slideList.innerHTML = '';
        slidesData.forEach((slide, index) => {
            const listItem = document.createElement('li');
            listItem.dataset.index = index;

            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            thumbnail.style.backgroundImage = `url('${slide.imageUrl}')`;

            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '&#9776;'; // Three horizontal lines

            const actions = document.createElement('div');
            actions.className = 'actions';

            const copyButton = document.createElement('button');
            copyButton.className = 'icon copy';
            copyButton.title = 'Copy';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.addEventListener('click', () => copySlide(index));

            const deleteButton = document.createElement('button');
            deleteButton.className = 'icon delete';
            deleteButton.title = 'Delete';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.addEventListener('click', () => deleteSlide(index));

            actions.appendChild(copyButton);
            actions.appendChild(deleteButton);

            listItem.appendChild(dragHandle);
            listItem.appendChild(thumbnail);
            listItem.appendChild(actions);

            slideList.appendChild(listItem);
        });

        // Make the list sortable
        new Sortable(slideList, {
            handle: '.drag-handle',
            animation: 150,
            onEnd: updateSlideOrder
        });
    }

    function updateSlideOrder() {
        const orderedSlides = [];
        slideList.querySelectorAll('li').forEach((item, index) => {
            const slideIndex = item.dataset.index;
            slidesData[slideIndex].order = index;
            orderedSlides.push(slidesData[slideIndex]);
            saveSlide(slidesData[slideIndex]); // Save each slide with the new order
        });
        slidesData = orderedSlides; // Update slidesData with the new order
        renderCarousel();
    }

    function copySlide(index) {
        const newSlide = { ...slidesData[index], id: `slide-${Date.now()}` };
        slidesData.push(newSlide);
        saveSlide(newSlide);
        renderSlideList();
        renderCarousel();
    }


    function deleteSlide(index) {
        deleteSlide(slidesData[index].id);
        slidesData.splice(index, 1);
        renderSlideList();
        renderCarousel();
    }


    saveOrderButton.addEventListener('click', () => {
        renderCarousel();
        slideOrderEditorDialog.style.display = 'none';
    });

    cancelOrderButton.addEventListener('click', () => {
        renderSlideList();
        slideOrderEditorDialog.style.display = 'none';
    });

    openSlideOrderEditorButton.addEventListener('click', () => {
        slideOrderEditorDialog.style.display = 'flex';
        renderSlideList();
    });

    // Close the dialog when clicking outside of it
    slideOrderEditorDialog.addEventListener('click', (event) => {
        if (event.target === slideOrderEditorDialog) {
            slideOrderEditorDialog.style.display = 'none';
        }
    });

    // Event listener for adding a new slide
    newSlideButton.addEventListener('click', newSlide);

    // Render the carousel on page load
    renderCarousel();
});