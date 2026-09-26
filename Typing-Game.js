
const typingGameOutputArea = document.querySelector(".typing-game-output-area");
const typingGameInput = document.querySelector(".typing-game-input");
const typingGameInputBtn = document.querySelector(".typing-game-input-btn");
const gameSlotResetBtn = document.querySelector(".game-slot-reset-btn");
const typingGameSoundEffect = document.querySelector(".typing-game-sound-effect");
const typingGameSoundEffectVolume = document.querySelector(".typing-game-sound-effect-volume");

const characterToggleBtn = document.querySelector(".character-toggle-btn");
const typingDateArea = document.querySelector(".typing-date-area");

const registrationNaming = document.querySelector(".registration-naming");
const registrationBtn = document.querySelector(".registration-btn");
const defaultTypingInput = document.querySelector(".defalut-typing-input");
const leftUpTypingInput = document.querySelector(".left-up-typing-input");
const rightUpTypingInput = document.querySelector(".right-up-typing-input");
const exclamationTypingInput = document.querySelector(".exclamation-typing-input");
const questionTypingInput = document.querySelector(".question-typing-input");

const saveDataArea = document.querySelector(".save-data-area");

const STORAGE_KEY = "typing-game-datas";
const MAX_IMAGE = 4;

const TOAST = {
    container: null,

    init() {
        if(!this.container) {
            this.container = document.createElement("div");
            this.container.classList.add("toast-container");
            document.body.append(this.container);
        }
    },

    show(message, data = null, duration = 5000) {
        this.init();

        const toast = document.createElement("div");
        toast.classList.add("toast");

        const messageText = document.createElement("span");
        messageText.textContent = message;
        toast.append(messageText);

        if(data) {
            toast.append(this.delete(data));
        }

        this.container.append(toast);

        setTimeout(() => {
            toast.classList.add("show");
        }, 100);

        setTimeout(() => {
            toast.classList.remove("show");

            toast.addEventListener("transitionend", () => {
                toast.remove();
            });
        }, duration);
    },

    delete(data) {
        const restoreBtn = document.createElement("button");
        restoreBtn.textContent = "복원";
        restoreBtn.classList.add("toast-restore-btn");

        restoreBtn.addEventListener("click", () => {
            restoreData(data);
            restoreBtn.disabled = true;
        });
        
        return restoreBtn;
    }
};

const typingAudio = new Audio();
typingAudio.src = typingGameSoundEffect.selectedOptions[0].dataset.src;
typingAudio.volume = typingGameSoundEffectVolume.value;

let datasets = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
datasets.forEach(dataset => { 
    dataset.visible = false;

    if(!dataset.position) { dataset.position = { x: 0, y: 0 }; }
});


let currentToggleState = false;
let currentTypingState = false;
let currentImageNum = 0;

let editingId = null;
let isEditing = false;


typingGameInput.addEventListener("keydown", (event) => {
    const settingData = datasets.filter(dataset => dataset.visible === true);
    if(settingData.length === 0) return;

    if(typingGameInput.value !== "") {
        currentTypingState = true;

        typingAudio.currentTime = 0;
        typingAudio.play();

        if(event.key === "!") {
            changeImage("!");
        } else if(event.key === "?") {
            changeImage("?");
        } else {
            changeImage();
        }
    } else {
        typingGameInputBtn.click();
    }
});

typingGameInputBtn.addEventListener("click", () => {
    const settingData = datasets.filter(dataset => dataset.visible === true);
    if(settingData.length === 0) return;

    currentTypingState = false;
    typingGameInput.value = "";
    changeImage();
});

typingGameSoundEffectVolume.addEventListener("input", () => {
    typingAudio.volume = typingGameSoundEffectVolume.value;
})

gameSlotResetBtn.addEventListener("click", () => {
    typingGameOutputArea.innerHTML = "";

    datasets.forEach(dataset => dataset.visible = false);
    currentImageNum = 0;
});

typingGameSoundEffect.addEventListener("change", () => {
    const selectedOption = typingGameSoundEffect.selectedOptions[0];
    typingAudio.src = selectedOption.dataset.src;
});

characterToggleBtn.addEventListener("click", () => {
    if(currentToggleState === false) {
        typingDateArea.classList.add("active");
        characterToggleBtn.textContent = "숨김";

        currentToggleState = true;
    } else {
        typingDateArea.classList.remove("active");
        characterToggleBtn.textContent = "열기";

        currentToggleState = false;
    }
});

registrationBtn.addEventListener("click", () => {
    if(datasets.length >= 5) {
        TOAST.show("등록은 최대 5개까지 가능합니다!");
        return;
    }
    if(!isInputState()) {
        return;
    }

    addDataset();
});

defaultTypingInput.addEventListener("change", isVaildImageFile);
leftUpTypingInput.addEventListener("change", isVaildImageFile);
rightUpTypingInput.addEventListener("change", isVaildImageFile);
exclamationTypingInput.addEventListener("change", isVaildImageFile);
questionTypingInput.addEventListener("change", isVaildImageFile);

document.addEventListener("keydown", function(e) {
    if(!e.target.matches("input, textarea, select")) return;

    if(e.key === "Enter") {
        typingGameInputBtn.click();
    }
});


//dataset setting function
async function addDataset() {
    const defaultFile = defaultTypingInput.files[0];
    const leftupFile = leftUpTypingInput.files[0];
    const rightUpFile = rightUpTypingInput.files[0];
    const exclamationFile = exclamationTypingInput.files[0];
    const questionFile = questionTypingInput.files[0];

    const data = {
        id: Date.now(),
        card: null,
        label: registrationNaming.value,

        default: defaultFile ? await fileToBase64(defaultFile) : "",
        leftUp: leftupFile ? await fileToBase64(leftupFile) : "",
        rightUp: rightUpFile ? await fileToBase64(rightUpFile) : "",
        exclamation: exclamationFile ? await fileToBase64(exclamationFile) : "",
        question: questionFile ? await fileToBase64(questionFile) : "",

        position: {
            x: 0,
            y: 0
        },
        changeLR: false,

        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    datasets.push(data);

    resetInput();
    saveDataset();
    rendersaveDataArea();
}

function editStartDataset(dataset) {
    editingId = dataset.id;
    isEditing = true;

    const miniCard = document.createElement("div");
    miniCard.classList.add("mini-card");

    const labelInput = document.createElement("div");
        const label = document.createElement("input");
        label.type = "text";
        label.maxLength = 9;
        label.value = dataset.label;
    labelInput.append(label);

    const defaultInput = createFileSelector("기본")
    const leftUpInput = createFileSelector("왼손 들기");
    const rightUpInput = createFileSelector("오른손 들기");
    const exclamationInput = createFileSelector("[선택] 느낌표");
    const questionInput = createFileSelector("[선택] 물음표");

    const btnArea = document.createElement("div");
    btnArea.classList.add("mini-card-btn-area");
        const doneBtn = document.createElement("button");
        doneBtn.textContent = "완료";
        doneBtn.addEventListener("click", () => {
            editEndDataset(dataset, label.value, defaultInput.file, leftUpInput.file, rightUpInput.file, exclamationInput.file, questionInput.file);
            miniCard.innerHTML = "";
            miniCard.remove();
        });

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "취소";
        cancelBtn.addEventListener("click", () => {
            editingId = null;
            isEditing = false;
            miniCard.innerHTML = "";
            miniCard.remove();
        });
    btnArea.append(doneBtn, cancelBtn);

    miniCard.append(labelInput, defaultInput.container, leftUpInput.container, rightUpInput.container, exclamationInput.container, questionInput.container);
    miniCard.append(btnArea);

    return miniCard;
}

async function editEndDataset(dataset, label, defaultFile, leftUpFile, rightUpFile, exclamationFile, questionFile) {
    if(label === "") {
        TOAST.show("이미지 이름을 입력해주세요!");
        return;
    }

    dataset.label = label;

    if(defaultFile.files[0] ||
        leftUpFile.files[0] ||
        rightUpFile.files[0] ||
        exclamationFile.files[0] ||
        questionFile.files[0]) {

        if(!defaultFile.files[0]) {
            TOAST.show("기본 이미지가 등록되지 않았습니다!");
            return;
        }

        if(!leftUpFile.files[0]) {
            TOAST.show("왼팔 들기 이미지가 등록되지 않았습니다!");
            return;
        }

        if(!rightUpFile.files[0]) {
            TOAST.show("오른팔 들기 이미지가 등록되지 않았습니다!");
            return;
        }
        
        dataset.default = await fileToBase64(defaultFile.files[0]);
        dataset.leftUp = await fileToBase64(leftUpFile.files[0]);
        dataset.rightUp = await fileToBase64(rightUpFile.files[0]);
        dataset.exclamation = exclamationFile.files[0] ? await fileToBase64(exclamationFile.files[0]) : "";
        dataset.question = questionFile.files[0] ? await fileToBase64(questionFile.files[0]) : "";
    }

    dataset.updatedAt = Date.now();

    saveDataset();
    rendersaveDataArea();

    editingId = null;
    isEditing = false;

    TOAST.show("정상적으로 수정되었습니다!");
}

    function createFileSelector(label) {
        const typeInput = document.createElement("div");

        const typeLabel = document.createElement("label");
        typeLabel.textContent = label;

        const typeFile = document.createElement("input");
        typeFile.type = "file";
        typeFile.accept = "image/*";
        typeFile.addEventListener("change", isVaildImageFile);
        
        typeInput.append(typeLabel, typeFile);

        return {
            container: typeInput,
            file: typeFile
        };
    }

function deleteDataset(targetDataset) {
    if(targetDataset === undefined) return;

    if(confirm("정말 삭제하시겠습니까?")) {
        datasets = datasets.filter(dataset => dataset.id !== targetDataset.id);

        saveDataset();
        rendersaveDataArea();

        TOAST.show("삭제되었습니다!");
    }
}

function restoreDataset(dataset) {
    datasets.push(dataset);

    saveDataset();
    TOAST.show("성공적으로 복원되었습니다!");
}

function createDatasetCard(dataset) {
    const card = document.createElement("div");
    card.classList.add("save-card");

    const image = document.createElement("img");
    image.src = dataset.default || "./source/error.png";
    image.alt = "캐릭터 등록 완료";
    image.width = 250;

    const label = document.createElement("p");
    label.classList.add("save-card-label");
    label.textContent = dataset.label;

    const btnArea = document.createElement("div");
    btnArea.classList.add("save-card-btn-area");
        const useBtn = document.createElement("button");
        useBtn.classList.add("save-card-btn");
        useBtn.textContent = "사용";
        useBtn.addEventListener("click", () => {
            if(dataset.visible === true) return;
            if(currentImageNum >= MAX_IMAGE) return;
            currentImageNum++;

            dataset.visible = true;
            settingGameArea();
        });

        const editBtn = document.createElement("button");
        editBtn.textContent = "수정";
        editBtn.classList.add("save-card-btn");
        editBtn.addEventListener("click", () => { card.append(editStartDataset(dataset)) });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "제거";
        deleteBtn.classList.add("save-card-btn");
        deleteBtn.addEventListener("click", () => {
            dataset.visible = false;

            deleteDataset(dataset);
        })
    btnArea.append(useBtn, editBtn, deleteBtn);

    card.append(image, label, btnArea);
    
    return card;
}

function rendersaveDataArea() {
    saveDataArea.innerHTML = "";

    const visibleDataset = datasets;
    visibleDataset.forEach(dataset => saveDataArea.append(createDatasetCard(dataset)));
}

//game function
function createGameCard(dataset) {
    const card = document.createElement("div");
    dataset.card = card;
    card.classList.add("game-card");

    const image = document.createElement("img");
    image.src = dataset.default || "./source/error.png";
    image.alt = "캐릭터 등록 완료";
    image.width = 400;
    card.append(image);

    const delBtn = document.createElement("button");
    delBtn.textContent = "제거";
    delBtn.addEventListener("click", () => {
        dataset.visible = false;
        currentImageNum--;
        settingGameArea();
    });
    delBtn.style.display = "none";
    card.append(delBtn);

    card.style.left = `${dataset.position.x}px`;
    card.style.top = `${dataset.position.y}px`;

    card.addEventListener("mousedown", (event) => {
        event.preventDefault();

        const cardRect = card.getBoundingClientRect();
        const offsetX = event.clientX - cardRect.left;
        const offsetY = event.clientY - cardRect.top;

        function moveCard(event) {
            const areaRect = typingGameOutputArea.getBoundingClientRect();
            const xRect = event.clientX - areaRect.left - offsetX;
            const yRect = event.clientY - areaRect.top - offsetY;

            card.style.left = `${xRect}px`;
            card.style.top = `${yRect}px`;
        }

        function stopMove() {
            dataset.position.x = parseFloat(card.style.left);
            dataset.position.y = parseFloat(card.style.top);
            document.removeEventListener("mousemove", moveCard);
            document.removeEventListener("mouseup", stopMove);
        }

        document.addEventListener("mousemove", moveCard);
        document.addEventListener("mouseup", stopMove);
    });

    document.addEventListener("click", (event) => {
        if(event.target === image) {
            delBtn.style.display = "block";
        } else {
            delBtn.style.display = "none";
        }
    });

    return card;
}

function moveGameCard(card) {
}

function settingGameArea() {
    typingGameOutputArea.innerHTML = "";

    const settingDatasets = datasets.filter(dataset => dataset.visible === true);
    settingDatasets.forEach(dataset => typingGameOutputArea.append(createGameCard(dataset)));
}

//image funtion
function changeImage(symbol = null) {
    const settingData = datasets.filter(dataset => dataset.visible === true);
    if(settingData.length === 0) return;

    settingData.forEach(dataset => {
        const card = dataset.card;
        const image = card.querySelector('img');

        if(dataset.exclamation !== "" && symbol === "!") {
            image.src = dataset.exclamation || "./source/error.png";
        } else if (dataset.question !== "" && symbol === "?") {
            image.src = dataset.question || "./source/error.png";
        } else if(currentTypingState) {
            image.src = dataset.changeLR ? dataset.leftUp : dataset.rightUp || "./source/error.png";
            dataset.changeLR = !dataset.changeLR;
        } else {
            image.src = dataset.default || "./source/error.png";
        }

        image.classList.remove("typing-move");
        void image.offsetWidth;
        image.classList.add("typing-move");
    });
}

//util function
function resetInput() {
    registrationNaming.value = "";
    defaultTypingInput.value = "";
    leftUpTypingInput.value = "";
    rightUpTypingInput.value = "";
    exclamationTypingInput.value = "";
    questionTypingInput.value = "";
}

function isInputState() {
    if(registrationNaming.value === "") {
        TOAST.show("이미지 이름을 입력해주세요!");
        return;
    }

    if(defaultTypingInput.value === "") {
        TOAST.show("기본 이미지가 등록되지 않았습니다!");
        return false;
    }

    if(leftUpTypingInput.value === "") {
        TOAST.show("왼팔 들기 이미지가 등록되지 않았습니다!");
        return false;
    }

    if(rightUpTypingInput.value === "") {
        TOAST.show("오른팔 들기 이미지가 등록되지 않았습니다!");
        return false;
    }

    return true;
}

async function isVaildImageFile(event) {
    const fileInput = event.target;
    const file = event.target.files[0];

    if(!file) {
        return false;
    }

    const maxSize = 1 * 1024 * 1024;

    if(file.size > maxSize) {
        TOAST.show("이미지는 1MB 이하만 사용할 수 있습니다!");
        fileInput.value = "";
        return false;
    }

    if(!file.type.startsWith('image/')) {
        TOAST.show("이미지 파일이 아닙니다!");
        fileInput.value = "";
        return false;
    }

    const isImage = await new Promise((resolve) => {
        const img = new Image();
        const objectURL = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectURL);
            resolve(true);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectURL);
            TOAST.show("손상되었거나 유효하지 않은 이미지 파일입니다!");
            fileInput.value = "";
            resolve(false);
        };

        img.src = objectURL;
    });

    return isImage;
}

//save function
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => { resolve(reader.result) };
        reader.onerror = () => { reject(reader.error) };

        reader.readAsDataURL(file);
    });
}

function saveDataset() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
}

rendersaveDataArea();
characterToggleBtn.click();
