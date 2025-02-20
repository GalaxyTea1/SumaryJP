const lesson25Vocabulary = [
    {
        lesson: "25",
        level: "N5",
        japanese: "乗り換えます",
        hiragana: "のりかえます",
        meaning: "chuyển tàu/xe",
        type: "động từ nhóm 2"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "通います",
        hiragana: "かよいます",
        meaning: "đi lại thường xuyên",
        type: "động từ nhóm 1"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "掛かります",
        hiragana: "かかります",
        meaning: "tốn (thời gian/tiền)",
        type: "động từ nhóm 1"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "出発します",
        hiragana: "しゅっぱつします",
        meaning: "xuất phát",
        type: "động từ する"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "到着します",
        hiragana: "とうちゃくします",
        meaning: "đến nơi",
        type: "động từ す"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "予約します",
        hiragana: "よやくします",
        meaning: "đặt chỗ",
        type: "động từ する"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "便",
        hiragana: "びん",
        meaning: "chuyến bay",
        type: "danh từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "切符",
        hiragana: "きっぷ",
        meaning: "vé",
        type: "danh từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "時刻表",
        hiragana: "じこくひょう",
        meaning: "bảng giờ tàu/xe",
        type: "danh từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "次",
        hiragana: "つぎ",
        meaning: "kế tiếp",
        type: "danh từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "空港",
        hiragana: "くうこう",
        meaning: "sân bay",
        type: "danh từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "飛行機",
        hiragana: "ひこうき",
        meaning: "máy bay",
        type: "danh từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "船",
        hiragana: "ふね",
        meaning: "tàu thủy",
        type: "danh từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "新幹線",
        hiragana: "しんかんせん",
        meaning: "tàu cao tốc",
        type: "danh từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "特急",
        hiragana: "とっきゅう",
        meaning: "tàu tốc hành",
        type: "danh từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "急行",
        hiragana: "きゅうこう",
        meaning: "tàu nhanh",
        type: "danh từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "普通",
        hiragana: "ふつう",
        meaning: "tàu thường",
        type: "danh từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "遅い",
        hiragana: "おそい",
        meaning: "muộn, chậm",
        type: "tính từ い"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "速い",
        hiragana: "はやい",
        meaning: "nhanh",
        type: "tính từ い"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "早い",
        hiragana: "はやい",
        meaning: "sớm",
        type: "tính từ い"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "直接",
        hiragana: "ちょくせつ",
        meaning: "trực tiếp",
        type: "phó từ"
    },
    {
        lesson: "25",
        level: "N5",
        japanese: "～番線",
        hiragana: "～ばんせん",
        meaning: "sân ga số ~",
        type: "phụ tố"
    }
];

const vocabularyManager = {
    currentLesson: null,
    lessons: {},
    reviewQueue: [],
    currentReviewVocab: null,
    currentFlashcardIndex: 0,
    flashcardDeck: [],

    async loadFromIndexedDB() {
        try {
            const allVocab = await dbManager.getAllVocabulary();
            
            this.lessons = {};
            allVocab.forEach(vocab => {
                if (!this.lessons[vocab.level]) {
                    this.lessons[vocab.level] = {};
                }
                if (!this.lessons[vocab.level][vocab.lesson]) {
                    this.lessons[vocab.level][vocab.lesson] = [];
                }
                this.lessons[vocab.level][vocab.lesson].push(vocab);
            });

            this.updateLessonSidebar();
        } catch (error) {
            console.error('Error loading vocabulary:', error);
            alert('Có lỗi khi tải dữ liệu. Vui lòng thử lại.');
        }
    },

    async addVocabulary(lesson, level, vocab) {
        try {
            vocab.lesson = lesson;
            vocab.level = level;
            vocab.status = "not-learned";
            vocab.lastReviewed = null;
            vocab.reviewCount = 0;

            await dbManager.saveVocabulary(vocab);
            await this.loadFromIndexedDB();
        } catch (error) {
            console.error('Error adding vocabulary:', error);
        }
    },

    async updateVocabularyStatus(id, newStatus) {
        try {
            const vocab = await dbManager.getVocabularyById(id);
            if (vocab) {
                vocab.status = newStatus;
                vocab.lastReviewed = new Date().toISOString();
                vocab.reviewCount = (vocab.reviewCount || 0) + 1;

                await dbManager.updateVocabulary(vocab);

                const row = document.querySelector(`tr[data-vocab-id="${id}"]`);
                if (row) {
                    row.className = `status-${newStatus}`;
                }
            }
        } catch (error) {
            console.error('Error updating vocabulary status:', error);
            alert('Có lỗi khi cập nhật trạng thái. Vui lòng thử lại.');
        }
    },

    async removeVocabulary(id) {
        if (confirm('Bạn có chắc muốn xóa từ này?')) {
            try {
                const vocab = await dbManager.getVocabularyById(id);
                const currentLesson = vocab.lesson;
                const currentLevel = vocab.level;

                await dbManager.deleteVocabulary(id);
                
                await this.loadFromIndexedDB();
                
                await this.displayVocabulary(currentLesson, currentLevel);

                this.updateLessonSidebar();
            } catch (error) {
                console.error('Error removing vocabulary:', error);
                alert('Có lỗi khi xóa từ vựng. Vui lòng thử lại.');
            }
        }
    },

    updateLessonSidebar() {
        const sidebar = document.getElementById("lesson-sidebar");
        const existingContent = sidebar.querySelector("h2").nextElementSibling;
        if (existingContent) {
            existingContent.remove();
        }

        const lessonList = document.createElement("div");
        lessonList.className = "lesson-list";

        Object.entries(this.lessons).forEach(([level, lessons]) => {
            Object.keys(lessons).forEach((lesson) => {
                const lessonItem = document.createElement("div");
                lessonItem.className = "lesson-item";
                lessonItem.onclick = () => this.displayVocabulary(lesson, level);
                lessonItem.innerHTML = `
                    <span class="lesson-name">Bài ${lesson} - ${level}</span>
                    <span class="lesson-count">${lessons[lesson].length}</span>
                `;
                lessonList.appendChild(lessonItem);
            });
        });

        sidebar.appendChild(lessonList);
    },

    startReviewSession() {
        this.reviewQueue = [];
        
        Object.entries(this.lessons).forEach(([level, lessons]) => {
            Object.entries(lessons).forEach(([lesson, vocabularies]) => {
                vocabularies.forEach(vocab => {
                    if (vocab.status !== 'mastered') {
                        this.reviewQueue.push({
                            ...vocab,
                            lesson,
                            level
                        });
                    }
                });
            });
        });
        
        this.reviewQueue.sort((a, b) => {
            const lastReviewA = new Date(a.lastReviewed || 0);
            const lastReviewB = new Date(b.lastReviewed || 0);
            return lastReviewA - lastReviewB;
        });

        if (this.reviewQueue.length === 0) {
            alert('Không có từ vựng để ôn tập');
            return;
        }

        this.showReviewUI();
    },

    showReviewUI() {
        const reviewContainer = document.getElementById('review-container');
        const reviewWord = document.getElementById('review-word');
        const reviewHint = document.getElementById('review-hint');

        this.currentReviewVocab = this.reviewQueue[0];
        
        reviewContainer.style.display = 'block';
        reviewWord.textContent = this.currentReviewVocab.japanese;
        reviewHint.textContent = `Hiragana: ${this.currentReviewVocab.hiragana}`;
    },checkReviewAnswer(correct) {
      if (correct) {
          this.currentReviewVocab.reviewCount++;
          
          if (this.currentReviewVocab.reviewCount >= 3) {
              const { lesson, level } = this.currentReviewVocab;
              const vocabularies = this.lessons[level][lesson];
              const vocabIndex = vocabularies.findIndex(v => 
                  v.japanese === this.currentReviewVocab.japanese
              );
              
              if (vocabIndex !== -1) {
                  vocabularies[vocabIndex].status = 'mastered';
              }
          }
      }
      
      this.currentReviewVocab.lastReviewed = new Date().toISOString();
      
      this.reviewQueue.push(this.reviewQueue.shift());
      
      if (this.reviewQueue.length > 0) {
          this.showReviewUI();
      } else {
          const reviewContainer = document.getElementById('review-container');
          reviewContainer.style.display = 'none';
          alert('Hoàn thành phiên ôn tập!');
          this.saveToLocalStorage();
          this.displayVocabulary(
              this.currentLesson.lesson, 
              this.currentLesson.level
          );
      }
  },

  startFlashcardMode() {
    document.getElementById('review-container').style.display = 'none';
    document.getElementById('vocab-form').style.display = 'none';
    document.getElementById('vocab-table').style.display = 'none';

    document.getElementById('flashcard-container').style.display = 'flex';

    this.prepareFlashcards();
    this.showCurrentCard();
},

prepareFlashcards() {
    this.flashcardDeck = [];
    this.currentFlashcardIndex = 0;

    Object.entries(this.lessons).forEach(([level, lessons]) => {
        Object.values(lessons).forEach(vocabularies => {
            this.flashcardDeck.push(...vocabularies);
        });
    });

    this.shuffleArray(this.flashcardDeck);
},

shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
},

showCurrentCard() {
    const card = this.flashcardDeck[this.currentFlashcardIndex];
    if (card) {
        const frontElement = document.getElementById('flashcard-japanese');
        frontElement.textContent = card.japanese;
        
        document.getElementById('flashcard-hiragana').textContent = card.hiragana;
        document.getElementById('flashcard-meaning').textContent = card.meaning;
        document.getElementById('flashcard-type').textContent = card.type;
        
        document.getElementById('card-progress').textContent = 
            `${this.currentFlashcardIndex + 1}/${this.flashcardDeck.length}`;
    }
},

nextCard() {
    if (this.currentFlashcardIndex < this.flashcardDeck.length - 1) {
        this.currentFlashcardIndex++;
        this.showCurrentCard();
    }
},

previousCard() {
    if (this.currentFlashcardIndex > 0) {
        this.currentFlashcardIndex--;
        this.showCurrentCard();
    }
},

exitFlashcardMode() {
    document.getElementById('flashcard-container').style.display = 'none';
    document.getElementById('vocab-form').style.display = 'grid';
    document.getElementById('vocab-table').style.display = 'table';
    
    this.currentFlashcardIndex = 0;
    this.flashcardDeck = [];
    
    const flashcard = document.querySelector('.flashcard');
    if (flashcard.classList.contains('flipped')) {
        flashcard.classList.remove('flipped');
    }
},

showStatistics() {
    document.querySelector('.stats-overlay').style.display = 'block';
    document.getElementById('statistics-container').style.display = 'block';
    this.updateStatistics();
},

closeStatistics() {
    document.querySelector('.stats-overlay').style.display = 'none';
    document.getElementById('statistics-container').style.display = 'none';
},

updateStatistics() {
    let totalWords = 0;
    let mastered = 0;
    let learning = 0;
    let notLearned = 0;

    Object.values(this.lessons).forEach(level => {
        Object.values(level).forEach(lesson => {
            lesson.forEach(word => {
                totalWords++;
                switch(word.status) {
                    case 'mastered':
                        mastered++;
                        break;
                    case 'in-progress':
                        learning++;
                        break;
                    case 'not-learned':
                        notLearned++;
                        break;
                }
            });
        });
    });

    document.getElementById('total-words').textContent = totalWords;
    document.getElementById('mastered-words').textContent = mastered;
    document.getElementById('learning-words').textContent = learning;
    document.getElementById('not-learned-words').textContent = notLearned;

    this.drawProgressChart(mastered, learning, notLearned);
},

drawProgressChart(mastered, learning, notLearned) {
    const ctx = document.getElementById('learning-progress').getContext('2d');
    
    if (this.progressChart) {
        this.progressChart.destroy();
    }
    
    this.progressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Đã thuộc', 'Đang học', 'Chưa học'],
            datasets: [{
                data: [mastered, learning, notLearned],
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
},

async toggleDifficulty(id) {
    try {
        const vocab = await dbManager.getVocabularyById(id);
        if (vocab) {
            vocab.isDifficult = !vocab.isDifficult;
            
            await dbManager.updateVocabulary(vocab);

            const row = document.querySelector(`tr[data-vocab-id="${id}"]`);
            if (row) {
                const starButton = row.querySelector('button');
                if (vocab.isDifficult) {
                    starButton.textContent = '★';
                    starButton.classList.add('difficult');
                } else {
                    starButton.textContent = '☆';
                    starButton.classList.remove('difficult');
                }
            }
        }
    } catch (error) {
        console.error('Error toggling difficulty:', error);
        alert('Có lỗi khi cập nhật trạng thái từ khó. Vui lòng thử lại.');
    }
},

async removeVocabulary(id) {
    if (confirm('Bạn có chắc muốn xóa từ này?')) {
        try {
            const vocab = await dbManager.getVocabularyById(id);
            const currentLesson = vocab.lesson;
            const currentLevel = vocab.level;

            await dbManager.deleteVocabulary(id);
            await this.loadFromIndexedDB();
            await this.displayVocabulary(currentLesson, currentLevel);

            this.updateLessonSidebar();
        } catch (error) {
            console.error('Error removing vocabulary:', error);
            alert('Có lỗi khi xóa từ vựng. Vui lòng thử lại.');
        }
    }
},

showDifficultWords() {
    const difficultWords = [];
    Object.entries(this.lessons).forEach(([level, lessons]) => {
        Object.entries(lessons).forEach(([lesson, words]) => {
            words.forEach(word => {
                if (word.isDifficult) {
                    difficultWords.push({...word, level, lesson});
                }
            });
        });
    });

    const modal = document.createElement('div');
    modal.className = 'difficult-words-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Danh sách từ khó</h2>
                <button onclick="this.closest('.difficult-words-modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                <table class="difficult-words-table">
                    <thead>
                        <tr>
                            <th>Từ</th>
                            <th>Hiragana</th>
                            <th>Nghĩa</th>
                            <th>Bài/Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${difficultWords.map(word => `
                            <tr>
                                <td>${word.japanese}</td>
                                <td>${word.hiragana}</td>
                                <td>${word.meaning}</td>
                                <td>Bài ${word.lesson} - ${word.level}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="modal-footer">
                    <button onclick="vocabularyManager.startDifficultWordsReview()">
                        Ôn tập từ khó
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
},

startDifficultWordsReview() {
    this.reviewQueue = [];
    Object.entries(this.lessons).forEach(([level, lessons]) => {
        Object.entries(lessons).forEach(([lesson, words]) => {
            words.forEach(word => {
                if (word.isDifficult) {
                    this.reviewQueue.push({...word, lesson, level});
                }
            });
        });
    });

    if (this.reviewQueue.length === 0) {
        alert('Không có từ khó để ôn tập');
        return;
    }

    this.shuffleArray(this.reviewQueue);
    
    document.querySelector('.difficult-words-modal').remove();
    
    this.showReviewUI();
},

startTest() {
    if (document.querySelector('.test-config-modal')) {
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'test-config-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Cấu hình bài kiểm tra</h3>
            <div class="test-config">
                <label>
                    Số lượng từ:
                    <input type="number" id="word-count" min="5" max="50" value="10">
                </label>
                <label>
                    Thời gian (phút):
                    <input type="number" id="test-time" min="1" max="30" value="5">
                </label>
            </div>
            <div class="modal-buttons">
                <button onclick="vocabularyManager.initializeTest()">Bắt đầu</button>
                <button onclick="vocabularyManager.closeTestConfig()">Hủy</button>
            </div>
        </div>
    `;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            vocabularyManager.closeTestConfig();
        }
    });

    document.body.appendChild(modal);
},

closeTestConfig() {
    const modal = document.querySelector('.test-config-modal');
    if (modal) {
        modal.remove();
    }
},

initializeTest() {
    const wordCount = parseInt(document.getElementById('word-count').value);
    const testTime = parseInt(document.getElementById('test-time').value);
    
    if (isNaN(wordCount) || isNaN(testTime) || wordCount < 5 || testTime < 1) {
        alert('Vui lòng nhập số lượng từ (ít nhất 5) và thời gian (ít nhất 1 phút)');
        return;
    }
    
    let allWords = [];
    Object.entries(this.lessons).forEach(([level, lessons]) => {
        Object.entries(lessons).forEach(([lesson, words]) => {
            allWords = allWords.concat(words.map(word => ({...word, level, lesson})));
        });
    });
    
    if (allWords.length < wordCount) {
        alert(`Bạn chỉ có ${allWords.length} từ. Vui lòng chọn số lượng từ ít hơn.`);
        return;
    }
    
    this.shuffleArray(allWords);
    this.testWords = allWords.slice(0, wordCount);
    this.currentTestIndex = 0;
    this.testAnswers = [];
    this.testStartTime = new Date();
    this.closeTestConfig();
    document.getElementById('test-container').style.display = 'flex';
    this.showTestQuestion();
    this.startTestTimer();
},

showTestQuestion() {
    const currentWord = this.testWords[this.currentTestIndex];
    document.getElementById('test-word').textContent = currentWord.japanese;
    document.getElementById('test-hint').textContent = `Hiragana: ${currentWord.hiragana}`;
    document.getElementById('test-progress').textContent = `${this.currentTestIndex + 1}/${this.testWords.length}`;
    document.getElementById('test-answer').value = '';
    document.getElementById('test-answer').focus();
},

submitAnswer() {
    const answer = document.getElementById('test-answer').value.trim().toLowerCase();
    const currentWord = this.testWords[this.currentTestIndex];
    const isCorrect = answer === currentWord.meaning.toLowerCase();
    
    this.testAnswers.push({
        word: currentWord,
        userAnswer: answer,
        correct: isCorrect
    });
    
    this.currentTestIndex++;
    
    if (this.currentTestIndex < this.testWords.length) {
        this.showTestQuestion();
    } else {
        this.finishTest();
    }
},

startTestTimer() {
    const timerElement = document.getElementById('test-timer');
    this.testTimer = setInterval(() => {
        const elapsed = Math.floor((new Date() - this.testStartTime) / 1000);
        const remaining = this.testTimeLimit - elapsed;
        
        if (remaining <= 0) {
            this.finishTest();
            return;
        }
        
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
},

finishTest() {
    clearInterval(this.testTimer);
    
    const correctCount = this.testAnswers.filter(a => a.correct).length;
    const score = Math.round((correctCount / this.testWords.length) * 100);
    const timeTaken = Math.floor((new Date() - this.testStartTime) / 1000);
    
    document.getElementById('test-container').style.display = 'none';
    document.getElementById('test-results').style.display = 'block';
    document.getElementById('final-score').textContent = score;
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('wrong-count').textContent = this.testWords.length - correctCount;
    document.getElementById('time-taken').textContent = 
        `${Math.floor(timeTaken / 60).toString().padStart(2, '0')}:${(timeTaken % 60).toString().padStart(2, '0')}`;
    document.getElementById('answers-review').innerHTML = this.testAnswers.map(a => `
        <div class="answer-item ${a.correct ? 'correct' : 'wrong'}">
            <span>${a.word.japanese}</span>
            <span>${a.userAnswer}</span>
        </div>
    `).join('');
},

closeTest() {
    document.getElementById('test-results').style.display = 'none';
},

async displayVocabulary(lesson, level) {
    try {
        this.currentLesson = { lesson, level };
        
        document.getElementById('current-lesson-title').textContent = 
            `Bài ${lesson} - ${level}`;

        const vocabularies = await dbManager.getVocabularyByLesson(level, lesson);
        
        const tbody = document.getElementById('vocab-list');
        tbody.innerHTML = '';

        vocabularies.forEach((vocab) => {
            const row = document.createElement('tr');
            row.setAttribute('data-vocab-id', vocab.id);
            row.className = `status-${vocab.status}`;
            row.innerHTML = `
                <td>${vocab.japanese}</td>
                <td>${vocab.hiragana}</td>
                <td>${vocab.meaning}</td>
                <td>${vocab.type}</td>
                <td>
                    <select onchange="vocabularyManager.updateVocabularyStatus('${vocab.id}', this.value)">
                        <option value="not-learned" ${vocab.status === 'not-learned' ? 'selected' : ''}>Chưa học</option>
                        <option value="learning" ${vocab.status === 'learning' ? 'selected' : ''}>Đang học</option>
                        <option value="mastered" ${vocab.status === 'mastered' ? 'selected' : ''}>Đã thuộc</option>
                    </select>
                </td>
                <td>
                    <button onclick="vocabularyManager.toggleDifficulty('${vocab.id}')" 
                        class="${vocab.isDifficult ? 'difficult' : ''}">
                        ${vocab.isDifficult ? '★' : '☆'}
                    </button>
                </td>
                <td>
                    <button onclick="vocabularyManager.editVocabulary('${vocab.id}')" class="edit-btn">Sửa</button>
                    <button onclick="vocabularyManager.removeVocabulary('${vocab.id}')">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error displaying vocabulary:', error);
        alert('Có lỗi khi hiển thị từ vựng. Vui lòng thử lại.');
    }
},

async addBulkVocabulary(vocabularyList) {
    try {
        for (const vocab of vocabularyList) {
            await dbManager.saveVocabulary({
                lesson: vocab.lesson,
                level: vocab.level,
                japanese: vocab.japanese,
                hiragana: vocab.hiragana,
                meaning: vocab.meaning,
                type: vocab.type,
                status: "not-learned",
                lastReviewed: null,
                reviewCount: 0
            });
        }
    } catch (error) {
        console.error('Error adding bulk vocabulary:', error);
        throw error;
    }
},

importMinnaBai25: async function() {
    if (confirm('Bạn có chắc muốn thêm từ vựng bài 25 không? Hành động này có thể tạo ra các bản sao nếu dữ liệu đã tồn tại.')) {
        try {
            await this.addBulkVocabulary(lesson25Vocabulary);
            await this.loadFromIndexedDB();
            await this.displayVocabulary("25", "N5");
            this.updateLessonSidebar();
            alert('Đã thêm thành công từ vựng bài 25!');
        } catch (error) {
            console.error('Error importing Minna No Nihongo Lesson 25:', error);
            alert('Có lỗi khi thêm từ vựng bài 25. Vui lòng thử lại.');
        }
    }
},

importN4Part1: async function() {
    if (confirm('Bạn có chắc muốn thêm từ vựng N4 (bài 26-30) không?')) {
        try {
            await this.addBulkVocabulary(lesson26To30Vocabulary);
            await this.loadFromIndexedDB();
            this.updateLessonSidebar();
            alert('Đã thêm thành công từ vựng N4 (bài 26-30)!');
        } catch (error) {
            console.error('Error importing N4 lessons 26-30:', error);
            alert('Có lỗi khi thêm từ vựng. Vui lòng thử lại.');
        }
    }
},

async editVocabulary(id) {
    try {
        const vocab = await dbManager.getVocabularyById(id);
        if (!vocab) return;

        const editForm = document.createElement('div');
        editForm.className = 'edit-form-modal';
        editForm.innerHTML = `
            <div class="modal-content">
                <h3>Sửa từ vựng</h3>
                <form id="edit-vocab-form">
                    <input type="text" id="edit-japanese" value="${vocab.japanese}" placeholder="Kanji" required>
                    <input type="text" id="edit-hiragana" value="${vocab.hiragana}" placeholder="Hiragana" required>
                    <input type="text" id="edit-meaning" value="${vocab.meaning}" placeholder="Nghĩa tiếng Việt" required>
                    <select id="edit-type">
                        <option value="Danh từ" ${vocab.type === 'Danh từ' ? 'selected' : ''}>Danh từ</option>
                        <option value="Động từ" ${vocab.type === 'Động từ' ? 'selected' : ''}>Động từ</option>
                        <option value="Tính từ" ${vocab.type === 'Tính từ' ? 'selected' : ''}>Tính từ</option>
                    </select>
                    <div class="modal-buttons">
                        <button type="submit">Lưu</button>
                        <button type="button" onclick="this.closest('.edit-form-modal').remove()">Hủy</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(editForm);

        document.getElementById('edit-vocab-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedVocab = {
                ...vocab,
                japanese: document.getElementById('edit-japanese').value,
                hiragana: document.getElementById('edit-hiragana').value,
                meaning: document.getElementById('edit-meaning').value,
                type: document.getElementById('edit-type').value
            };

            await dbManager.updateVocabulary(updatedVocab);
            editForm.remove();
            await this.displayVocabulary(vocab.lesson, vocab.level);
        });

    } catch (error) {
        console.error('Error editing vocabulary:', error);
        alert('Có lỗi khi sửa từ vựng. Vui lòng thử lại.');
    }
}
};

window.onload = async function() {
    try {
        await dbManager.init();
        await vocabularyManager.loadFromIndexedDB();
        await storageManager.checkStorageQuota();
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        actionButtons.innerHTML = `
            <button onclick="storageManager.exportData()">Export Data</button>
            <input type="file" id="import-file" accept=".json" style="display: none"
                onchange="storageManager.importData(this.files[0])">
            <button onclick="document.getElementById('import-file').click()">
                Import Data
            </button>
            <button onclick="vocabularyManager.importMinnaBai25()">
                Import Data Bài 25
            </button>
        `;
        document.querySelector('.vocabulary-section').prepend(actionButtons);

        document.getElementById('vocab-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const lesson = prompt('Nhập số bài học:');
            if (!lesson) return;

            const vocab = {
                japanese: document.getElementById('japanese-input').value,
                hiragana: document.getElementById('hiragana-input').value,
                meaning: document.getElementById('meaning-input').value,
                type: document.getElementById('type-select').value
            };

            const level = document.getElementById('level-select').value;

            vocabularyManager.addVocabulary(lesson, level, vocab);
            this.reset();
        });

        document.getElementById('review-answer').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const answer = this.value.trim().toLowerCase();
                const correctAnswer = vocabularyManager.currentReviewVocab.meaning.toLowerCase();
                const resultElement = document.getElementById('review-result');
                
                if (answer === correctAnswer) {
                    resultElement.textContent = `✅ Chính xác! "${correctAnswer}"`;
                    resultElement.className = 'review-result correct';
                    vocabularyManager.checkReviewAnswer(true);
                } else {
                    resultElement.textContent = `❌ Sai rồi! Đáp án đúng là: "${correctAnswer}"`;
                    resultElement.className = 'review-result incorrect';
                    vocabularyManager.checkReviewAnswer(false);
                }
                
                this.value = '';
                
                setTimeout(() => {
                    resultElement.textContent = '';
                    resultElement.className = 'review-result';
                }, 2000);
            }
        });

        document.querySelector('.flashcard').addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Có lỗi khi khởi tạo ứng dụng. Vui lòng tải lại trang.');
    }
};