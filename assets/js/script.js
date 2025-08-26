const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)


const app = {
    songs: [],
    currentIndex: 0,
    isPlay: false,
    isLoop: false,
    isRandom: false,
    songsIsUsed: new Set(),


    loadSongs: async function () {
        let res = await fetch('./songs/songs.json')
        let songs = await res.json()
        this.songs = songs
    },

    renderPlayList: function () {
        let html = ''
        this.songs.forEach(song => {
            html += `
                <div class="item" data-id="${song.id}">
                    <div class="item-cover" style="background: url(${song.cover}) center / cover no-repeat"></div>
                    <div class="item-detail">
                        <h3 class="item-title">${song.title}</h3>
                        <p class="item-artist">${song.artist}</p>
                    </div>
                </div>
            `
        })

        let playList = $('#play-list')
        playList.innerHTML = html
    },

    renderCurrentSong: function () {
        let title = $('.header-name-song')
        let cd = $('.cd')
        let audio = $('.audio')
        title.textContent = this.songs[this.currentIndex].title
        cd.style.background = `url("${this.songs[this.currentIndex].cover}") center / cover no-repeat`
        audio.src = this.songs[this.currentIndex].audio
        this.highlightSongActive()
    },

    highlightSongActive: function () {
        let songsList = $$('#play-list .item')
        let songCurrId = this.songs[this.currentIndex].id
        let songOld = $('#play-list .item.song-active')
        if (songOld) songOld.classList.remove('song-active')

        songsList.forEach(song => {
            if (song.dataset.id == songCurrId) {
                song.classList.add('song-active')
                // kéo song vào giữa màn hình
                let options
                if (songCurrId == 0) {
                    options = {
                        block: 'end',
                        behavior: 'smooth'
                    }
                }
                else {
                    options = {
                        block: 'center',
                        behavior: 'smooth'
                    }
                }
                song.scrollIntoView(options)
            }
        })
    },

    getRandomIndex: function () {
        let randomIndex
        let idUsed = [...this.songsIsUsed].map(song => {
            return song.id
        })

        do {
            randomIndex = Math.floor(Math.random() * this.songs.length)
        } while (idUsed.length < this.songs.length && idUsed.includes(randomIndex))

        return randomIndex
    },

    handleEvent: function () {
        const _this = this
        let cd = $('.cd')
        let audio = $('.audio')
        let progress = $('.progress')


        // Scroll page
        let width = cd.offsetWidth

        document.onscroll = function () {
            let scrollTop = document.documentElement.scrollTop
            let newWidth = Math.max(width - scrollTop / 2, 0)
            cd.style.width = newWidth + 'px'
            cd.style.opacity = newWidth / width

            let dashboard = $('#dashboard')
            if (newWidth < 100) dashboard.style.marginTop = '0px'
            else dashboard.style.marginTop = '8px'
        }

        // CD rotate
        const cdAnimate = cd.animate(
            { transform: 'rotate(360deg)' },
            {
                duration: 15000,
                iterations: Infinity
            }
        )
        cdAnimate.pause()

        // Play/Pause nhạc
        let playBtn = $('.btn-play')

        playBtn.onclick = function () {
            if (!_this.isPlay) {
                audio.play()
                playBtn.classList.replace('ti-control-play', 'ti-control-pause')
                cdAnimate.play()
            }
            else {
                audio.pause()
                playBtn.classList.replace('ti-control-pause', 'ti-control-play')
                cdAnimate.pause()
            }
            _this.isPlay = !_this.isPlay
        }

        // Progress
        audio.ontimeupdate = function () {
            let fullTime = audio.duration
            if (fullTime) {
                let curTime = audio.currentTime
                let timePercent = curTime / fullTime * 100
                progress.value = timePercent
            }
        }

        // Seek
        progress.oninput = function () {
            let fullTime = audio.duration
            let timePercent = Number(progress.value)
            let newTime = timePercent / 100 * fullTime
            audio.currentTime = newTime
            if (!_this.isPlay) playBtn.click()
        }

        // Backward
        let backwardBtn = $('.btn-backward')
        backwardBtn.onclick = function () {
            if (_this.isRandom) _this.currentIndex = _this.getRandomIndex()
            else {
                _this.currentIndex--;
                if (_this.currentIndex < 0) _this.currentIndex = _this.songs.length - 1
            }

            _this.renderCurrentSong()
            audio.play()
            if (!_this.isPlay) playBtn.click()
        }

        // Forward
        let forwardBtn = $('.btn-forward')
        forwardBtn.onclick = function () {
            if (_this.isRandom) _this.currentIndex = _this.getRandomIndex()
            else {
                _this.currentIndex++;
                if (_this.currentIndex >= _this.songs.length) _this.currentIndex = 0
            }

            _this.renderCurrentSong()
            audio.play()
            if (!_this.isPlay) playBtn.click()

        }

        // Add song in songsIsUsed
        audio.onplay = function () {
            _this.songsIsUsed.add(_this.songs[_this.currentIndex])

            if (_this.songsIsUsed.size === _this.songs.length) {
                _this.songsIsUsed.clear()
                _this.songsIsUsed.add(_this.songs[_this.currentIndex])
            }
        }

        // End song
        audio.onended = function () {
            if (_this.isLoop) {
                audio.play()
            }
            else if (!_this.isRandom) {
                forwardBtn.click()
            }
            else {
                let randomIndex = _this.getRandomIndex()
                _this.currentIndex = randomIndex
                _this.renderCurrentSong()
                audio.play()
            }
        }

        // Ramdom
        let randomBtn = $('.btn-random')
        randomBtn.onclick = function () {
            randomBtn.classList.toggle('active')
            _this.isRandom = !_this.isRandom
        }

        // Loop
        let loopBtn = $('.btn-loop')
        loopBtn.onclick = function () {
            loopBtn.classList.toggle('active')
            _this.isLoop = !_this.isLoop
        }

        // Click song 
        let playList = $$('#play-list .item')
        playList.forEach(song => {
            song.onclick = function() {
                let id = song.dataset.id
                _this.currentIndex = id
                _this.renderCurrentSong()
                audio.play()
                if (!_this.isPlay) playBtn.click()
            }
        })

    },

    start: async function () {
        await this.loadSongs()
        this.renderPlayList()
        this.renderCurrentSong()
        this.handleEvent()
    }
}

app.start()