import { db, collection, getDocs, doc, setDoc, deleteDoc } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', function () {
    let activeSlide = 0;
    let currentTextElement = null;
    let slidesData = [];

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
            imageUrl: './assets/default.jpg',  // Default background image
            textBoxData: [{
                left: '50%',
                top: '50%',
                text: 'New Text',
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#000000',
                fontWeight: 'normal',
                fontStyle: 'normal',
                textDecoration: 'none'
            }],
            order: slidesData.length // Ensure correct ordering
        };

        // Save the new slide to Firestore
        saveSlide(newSlide);

        // Re-render the carousel to include the new slide
        renderCarousel();
    }

    // Make a text box draggable
    function makeTextBoxDraggable(textBox) {
        textBox.addEventListener('mousedown', function (e) {
            e.preventDefault(); // Prevent default behavior

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

    // Select a text box
    function selectTextBox(textBox) {
        document.querySelectorAll('.text-box').forEach(box => {
            box.classList.remove('selected');
        });
        textBox.classList.add('selected');
    }

    // Render the carousel
    async function renderCarousel() {
        carousel.innerHTML = ''; // Clear existing slides
        slidesData = await fetchSlides();
        slidesData.sort((a, b) => a.order - b.order); // Ensure slides are ordered correctly

        slidesData.forEach(slide => {
            const slideElement = document.createElement('div');
            slideElement.className = 'slide';
            slideElement.style.backgroundImage = `url('${slide.imageUrl}')`;
            slideElement.dataset.id = slide.id;

            // Fallback to an empty array if textBoxData is undefined
            const textBoxDataArray = slide.textBoxData || [];

            // Loop through textBoxData to recreate all textboxes
            textBoxDataArray.forEach(textBoxData => {
                const textBox = document.createElement('div');
                textBox.className = 'text-box';
                textBox.style.left = textBoxData.left;
                textBox.style.top = textBoxData.top;

                const draggableText = document.createElement('div');
                draggableText.className = 'draggable-text';
                draggableText.textContent = textBoxData.text;
                draggableText.style.fontSize = textBoxData.fontSize;
                draggableText.style.fontFamily = textBoxData.fontFamily;
                draggableText.style.color = textBoxData.color;
                draggableText.style.fontWeight = textBoxData.fontWeight;
                draggableText.style.fontStyle = textBoxData.fontStyle;
                draggableText.style.textDecoration = textBoxData.textDecoration;

                textBox.appendChild(draggableText);
                makeTextBoxDraggable(textBox);
                slideElement.appendChild(textBox);
            });

            carousel.appendChild(slideElement);
        });
        initializeSlides();
    }

    // Initialize slides and other elements
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

        // Select slide logic
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

    // Update editor inputs based on the selected text element
    function updateEditorInputs() {
        if (currentTextElement) {
            textInput.value = currentTextElement.textContent;
            fontSizeDisplay.textContent = parseInt(window.getComputedStyle(currentTextElement).fontSize);
            colorInput.value = window.getComputedStyle(currentTextElement).color;
        }
    }

    // Save the current state of the slide
    function saveState() {
        const activeSlideElement = document.querySelector('.slide.active');
        const slideId = activeSlideElement.dataset.id;
        const textBoxes = activeSlideElement.querySelectorAll('.text-box');

        let slideData = {
            id: slideId,
            imageUrl: activeSlideElement.style.backgroundImage,
            textBoxData: [],  // Array to store data of all textboxes
            order: slidesData.find(slide => slide.id === slideId).order
        };

        // Loop through each textbox and capture relevant data
        textBoxes.forEach(textBox => {
            const draggableText = textBox.querySelector('.draggable-text');
            const textBoxData = {
                left: textBox.style.left,
                top: textBox.style.top,
                text: draggableText.textContent,
                fontSize: window.getComputedStyle(draggableText).fontSize,
                fontFamily: window.getComputedStyle(draggableText).fontFamily,
                color: window.getComputedStyle(draggableText).color,
                fontWeight: window.getComputedStyle(draggableText).fontWeight,
                fontStyle: window.getComputedStyle(draggableText).fontStyle,
                textDecoration: window.getComputedStyle(draggableText).textDecoration
            };
            slideData.textBoxData.push(textBoxData);
        });

        saveSlide(slideData);  // Save updated slide data to the DB
    }

    // Add a new text box to the slide
    function addTextBox(textContent = 'New Text') {
        const textBox = document.createElement('div');
        textBox.classList.add('text-box');
        const newTextElement = document.createElement('div');
        newTextElement.classList.add('draggable-text');
        newTextElement.textContent = textContent;

        textBox.appendChild(newTextElement);
        document.querySelector('.slide.active').appendChild(textBox);
        makeTextBoxDraggable(textBox);

        // Update currentTextElement and editor inputs
        currentTextElement = newTextElement;
        updateEditorInputs();

        saveState();  // Save the state immediately after adding
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
            currentTextElement.style.fontWeight = currentTextElement.style.fontWeight === 'bold' ? 'normal' : 'bold';
            saveState(); // Save state after bold change
        }
    });

    // Italic text
    italicButton.addEventListener('click', function () {
        if (currentTextElement) {
            currentTextElement.style.fontStyle = currentTextElement.style.fontStyle === 'italic' ? 'normal' : 'italic';
            saveState(); // Save state after italic change
        }
    });

    // Underline text
    underlineButton.addEventListener('click', function () {
        if (currentTextElement) {
            currentTextElement.style.textDecoration = currentTextElement.style.textDecoration === 'underline' ? 'none' : 'underline';
            saveState(); // Save state after underline change
        }
    });

    // Strikethrough text
    strikethroughButton.addEventListener('click', function () {
        if (currentTextElement) {
            currentTextElement.style.textDecoration = currentTextElement.style.textDecoration === 'line-through' ? 'none' : 'line-through';
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

    // Update the order of slides after rearranging
    async function updateSlideOrder() {
        const orderedSlides = [];
        slideList.querySelectorAll('li').forEach((item, index) => {
            const slideIndex = item.dataset.index;
            const slide = slidesData[slideIndex];
            slide.order = index;
            orderedSlides.push(slide);
        });

        // Save each slide with the new order
        for (const slide of orderedSlides) {
            await saveSlide(slide);
    }

    slidesData = orderedSlides; // Update slidesData with the new order
    renderCarousel();
}

    function copySlide(index) {
        const newSlide = { ...slidesData[index], id: `slide-${Date.now()}`, order: slidesData.length };
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

    // Event listener for adding a new slide
    newSlideButton.addEventListener('click', newSlide);

    // Render the carousel on page load
    renderCarousel();
});