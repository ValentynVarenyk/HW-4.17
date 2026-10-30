const API_KEY = "58313827-e4000e29ec86bdc48bb912b99";
const API_URL = "https://pixabay.com/api/";

const PER_PAGE = 12;
const STORAGE_KEY = "pixabay-gallery";

const gallery = document.querySelector("#gallery");
const loadMoreButton = document.querySelector("#loadMore");
const status = document.querySelector("#status");

let currentPage = 0;
let totalHits = 0;
let allImages = [];
let isLoading = false;



function createImageCard(image) {
    const card = document.createElement("div");
    card.classList.add("image-card");

    const img = document.createElement("img");
    img.src = image.webformatURL;
    img.alt = image.tags;
    img.loading = "lazy";

    const info = document.createElement("div");
    info.classList.add("image-info");

    const author = document.createElement("p");
    author.textContent = "Автор: " + image.user;

    const views = document.createElement("p");
    views.textContent = "Перегляди: " + image.views;

    const link = document.createElement("a");
    link.href = image.pageURL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Переглянути на Pixabay";

    info.append(author, views, link);
    card.append(img, info);

    return card;
}



function renderImages(images) {
    images.forEach(function(image) {
        const card = createImageCard(image);
        gallery.append(card);
    });
}



function saveState() {
    const data = {
        page: currentPage,
        totalHits: totalHits,
        images: allImages,
        timestamp: Date.now()
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Не вдалося зберегти галерею:", error);
    }
}



function restoreState() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
        return false;
    }

    try {
        const data = JSON.parse(savedData);

        if (
            !Array.isArray(data.images) ||
            !data.images.length ||
            Date.now() - data.timestamp > 24 * 60 * 60 * 1000
        ) {
            localStorage.removeItem(STORAGE_KEY);
            return false;
        }

        currentPage = data.page;
        totalHits = data.totalHits;
        allImages = data.images;

        renderImages(allImages);
        updateButton();

        status.textContent = "Відновлено попередню галерею.";

        return true;

    } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
    }
}



async function fetchImages() {
    if (isLoading) {
        return;
    }

    isLoading = true;
    loadMoreButton.disabled = true;
    status.textContent = "Завантаження...";

    const nextPage = currentPage + 1;

    const params = new URLSearchParams({
        key: API_KEY,
        editors_choice: "true",
        image_type: "photo",
        safesearch: "true",
        page: nextPage,
        per_page: PER_PAGE
    });

    try {
        const response = await fetch(API_URL + "?" + params);

        if (!response.ok) {
            throw new Error("Помилка запиту: " + response.status);
        }

        const data = await response.json();

        if (!data.hits || data.hits.length === 0) {
            status.textContent = "Більше зображень немає.";
            loadMoreButton.style.display = "none";
            return;
        }

        currentPage = nextPage;
        totalHits = data.totalHits;

        allImages.push(...data.hits);

        renderImages(data.hits);

        saveState();

        status.textContent = "Завантажено сторінку " + currentPage;

        updateButton();

    } catch (error) {
        status.textContent = "Не вдалося завантажити зображення.";

        console.error(error);

    } finally {
        isLoading = false;

        if (currentPage * PER_PAGE < totalHits) {
            loadMoreButton.disabled = false;
        }
    }
}



function updateButton() {
    if (currentPage * PER_PAGE >= totalHits) {
        loadMoreButton.style.display = "none";
    } else {
        loadMoreButton.style.display = "block";
        loadMoreButton.disabled = false;
    }
}



loadMoreButton.addEventListener("click", fetchImages);



if (!restoreState()) {
    fetchImages();
}