// *名称：canvas仿慕课网贪吃蛇
// *作者：章理

window.onload = function() {
    Game = new GluttonousSnake('gameCanvas')
    
    var snakeAudio = document.querySelector('.snake-audio')
    var gameMusic = document.querySelector('.game-music')
    var gameButton = document.querySelector('.game-button')

    gameButton.onclick = function() {
        if (Game.isOverGame) {
            // 再来
            Game.restart()
        }

        if (Game.isInGame) {
            // 暂停
            this.innerHTML = '继续'
            Game.stopGame()
            Game.isOpenAudio && snakeAudio.pause()
        } else {
            // 继续
            this.innerHTML = '暂停'
            Game.startGame()
            Game.isOpenAudio && snakeAudio.play()
        }
        Game.isInGame = !Game.isInGame
    }

    gameMusic.onclick = function() {
        var isClose = this.classList.toggle('close')

        if (isClose) {
            // 关闭
            Game.isOpenAudio = false
            if (Game.isInGame) {
                snakeAudio.pause()
            }
        } else {
            // 开启
            Game.isOpenAudio = true
            if (Game.isInGame) {
                snakeAudio.play()
            }
        }
    }
}

var GluttonousSnake = function (id) {
    this.canvas = document.getElementById(id)
    this.ctx = this.canvas.getContext('2d')
    this.mapLength = 25
    this.grid = 18
    // this.gameMap = []
    // 1 => 苹果
    // 0 => 空白
    // 2 => 蛇头
    // 3 => 蛇身
    // 4 => 蛇尾
    this.map_2017 = [
        [1, 0, 2, 3, 3, 0, 2, 3, 3, 0, 0, [2, 't'], 0, 2, 3, 3],
        [0, 0, 0, 0, 3, 0, [4, 'b'], 0, 3, 0, 0, 3, 0, 0, 0, 3],
        [0, 0, 3, 3, 3, 0, 3, 0, 3, 0, 0, 3, 0, 0, 0, 3],
        [0, 0, 3, 0, 0, 0, 3, 0, 3, 0, 0, 3, 0, 0, 0, 3],
        [0, 0, 3, 3, 4, 0, 3, 3, 3, 0, 0, [4, 't'], 0, 0, 0, [4, 't']]
    ];
    // 是否游戏中
    this.isInGame = false
    // 是否结束游戏
    this.isOverGame = false
    // 执行方向
    this.moveDir = 'r'
    // 准备方向 - 防止快速多次按下切换方向
    this.preDir = this.moveDir
    // 蛇的速度
    this.MaxSpeed = 240
    this.minSpeed = 80
    this.speed = this.MaxSpeed
    // 蛇 定时器
    this.snakeTimer = null
    // 蛇 
    this.snakeData = this._initSnakeMap()
    // [
    //     [0, 6], [0, 5], [0, 4], [0, 3], [0, 2], [0, 1], [0, 0], [0, -1]
    // ]
    // 食物
    this.food = []
    // 当前分数
    this.score = 0
    // 最高分数
    this.bestScore = 0
    // 是否开启音乐
    this.isOpenAudio = true
    
    this._init()
}

// 初始化蛇的坐标
GluttonousSnake.prototype._initSnakeMap = function() {
    var array = []
    var head = 6
    for (var i = 0; i < 8; i++) {
        array[i] = []
        array[i][0] = 0
        array[i][1] = head--
    }
    return array
}

GluttonousSnake.prototype._init = function() {
    // 绘制背景表格颜色
    this._drawGridBg()
    // 绘制入场 2017
    this._drawEntry_2017()
    // 绑定键盘事件 上下左右
    this._bindEvent()
}

GluttonousSnake.prototype.restart = function() {
    this.isOverGame = false
    this.moveDir = 'r'
    this.preDir = this.moveDir
    this.speed = this.MaxSpeed
    this.snakeTimer = null
    this.snakeData = this._initSnakeMap()
    this.food = []
    this.score = 0
    this.saveScore(0)
}

GluttonousSnake.prototype._bindEvent = function() {
    var _this = this
    var json = {
        37: 'l',
        38: 't',
        39: 'r',
        40: 'b'
    }
    document.onkeydown = function(ev) {
        if (!_this.isInGame) {
            return
        }
        
        var keyCode = ev.keyCode
        if (!json[keyCode] || json[keyCode] === _this.moveDir) {
            return
        }
        for (var n in json) {
            if (json[n] === _this.moveDir) {
                if (Math.abs(keyCode - n) === 2) {
                    return
                }
            }
        }
        // 设置为准备的方向，防止快速多次按下切换方向
        _this.preDir = json[keyCode]
    }
}

GluttonousSnake.prototype.stopGame = function() {
    window.clearInterval(this.snakeTimer)
}

GluttonousSnake.prototype.startGame = function() {
    this.goGame()
    this.snakeTimer = setInterval(() => {
        this.goGame()
    }, this.speed)
}

GluttonousSnake.prototype.goGame = function() {
    if (!this.food.length) {
        // 创建食物
        this._createFood()
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    // 绘制格子
    this._drawGridBg()

    var direct = this.moveDir = this.preDir
    var nextPos = this._nextPos(direct)
    // 是否撞墙
    var isOver = this._isCollision(nextPos)
    // 修改蛇的位置 路线
    var isChangeSpeed = null
    if (!isOver) {
        isChangeSpeed = this._walk(nextPos)
    }
    // 绘制蛇
    this._drawSnake()
    // 绘制食物
    this._drawFood()

    // 绘制完蛇，在进行判断
    if (isOver) {
        this._drawOver()
        return
    }
    // 最后才执行
    if (isChangeSpeed) {
        // 清除定时器重新触发
        this.stopGame()
        this.startGame()
    }
}

// 是否撞墙并返回值
GluttonousSnake.prototype._isCollision = function(nextPos) {
    if (this._collisionDetection(nextPos)) {
        this.stopGame()
        this._overGame()
        return true
    }
    return false
}

// 碰撞检测
GluttonousSnake.prototype._collisionDetection = function(next) {
    // 撞到墙了
    if (
        next[0] <= -1 || 
        next[1] <= -1 ||
        next[0] >= this.mapLength ||
        next[1] >= this.mapLength
    ) {
        return true
    }

    for (let i = 0; i < this.snakeData.length; i++) {
        // 撞到自己了
        if (this.snakeData[i][0] === next[0] && this.snakeData[i][1] === next[1]) {
            return true
        }
    }
}
// 绘制蛇
GluttonousSnake.prototype._drawSnake = function() {
    for (var i = 0; i < this.snakeData.length; i++) {
        var x = this.snakeData[i][0]
        var y = this.snakeData[i][1]
        var w = y * this.grid
        var h = x * this.grid
        if (i === 0) {
            // 蛇头和后面一个数据对比，得出方向
            var nextX = this.snakeData[i + 1][0]
            var nextY = this.snakeData[i + 1][1]
            var dir = null
            if (nextY - y === 1) {
                // 右
                dir = 'l'
            } else if (nextY - y === -1) {
                // 左
                dir = 'r'
            } else if (nextX - x === 1) {
                // 下
                dir = 't'
            } else if (nextX - x === -1) {
                // 上
                dir = 'b'
            }
            this.drawSnakeHead(w, h, dir)
        } else if (i === this.snakeData.length - 1) {
            // 和前面一个数据对比，得出方向
            var preX = this.snakeData[i - 1][0]
            var preY = this.snakeData[i - 1][1]
            var dir = null
            if (preY - y === 1) {
                // 右
                dir = 'r'
            } else if (preY - y === -1) {
                // 左
                dir = 'l'
            } else if (preX - x === 1) {
                // 下
                dir = 'b'
            } else if (preX - x === -1) {
                // 上
                dir = 't'
            }
            this.drawSnakeTail(w, h, dir)
        } else {
            this.drawSnakeBody(w, h)
        }
    }
}
// 行走路线-> 是否吃到食物
GluttonousSnake.prototype._walk = function(nextPos) {
    var isChange = false
    // 是否吃到食物
    if (this._isEat(nextPos)) {
        // 创建食物坐标
        this._createFood()
        // 更新分数
        var nowScore = this.score += 1
        this.bestScore = nowScore > this.bestScore ? nowScore : this.bestScore  
        this.saveScore(nowScore)
        this.saveBestScore(this.bestScore)
        // 减速度
        var residue = this.MaxSpeed - parseInt(this.score / 10) * this.minSpeed
        // 检测是否变化了速度
        if (residue !== this.speed && residue >= this.minSpeed) {
            isChange = true
        }
        this.speed = residue <= this.minSpeed ? this.minSpeed : residue
        // 放音乐
        this.eatAudioPlay()
    } else {
        this.snakeData.pop()
    }
    this.snakeData.unshift(nextPos)

    return isChange
}

GluttonousSnake.prototype.saveScore = function(score) {
    document.querySelector('.score-container').innerHTML = score
}
GluttonousSnake.prototype.saveBestScore = function(score) {
    document.querySelector('.best-container').innerHTML = score
}

// 是否吃到食物
GluttonousSnake.prototype._isEat = function(nextPos) {
    if (this.food[0] === nextPos[0] && this.food[1] === nextPos[1]) {
        return true
    } else {
        return false
    }
}

// 计算出下一个移动到位置
GluttonousSnake.prototype._nextPos = function(direct) {
    var nextArray = []
    var x = this.snakeData[0][0]
    var y = this.snakeData[0][1]

    if (direct === 't') {
        nextArray[0] = x - 1
        nextArray[1] = y
    } else if (direct === 'r') {
        nextArray[0] = x
        nextArray[1] = y + 1
    } else if (direct === 'b') {
        nextArray[0] = x + 1
        nextArray[1] = y
    } else if (direct === 'l') {
        nextArray[0] = x
        nextArray[1] = y - 1
    }
    return nextArray
}

GluttonousSnake.prototype._createFood = function() {
    var food_x = parseInt(Math.random() * this.mapLength)
    var food_y = parseInt(Math.random() * this.mapLength)
    var isExist = false
    
    for (var i = 0; i < this.snakeData.length; i++) {
        if (this.snakeData[i][0] === food_x && this.snakeData[i][1] === food_y) {
            // console.log('随机重复了')
            isExist = true
            break
        }
    }

    if (isExist) {
        this._createFood()
    } else {
        this.food = [food_x, food_y]    
    }
}

GluttonousSnake.prototype._drawFood = function() {
    this.drawFruit(this.food[1] * this.grid, this.food[0] * this.grid)
}

GluttonousSnake.prototype._drawGridBg = function() {
    for (var i = 0; i < this.mapLength; i++) {
        for (var j = 0; j < this.mapLength; j++) {
            this._gridFill(
                j * this.grid,
                i * this.grid,
                j + i * this.grid + 1,
                i + 1
            )
        }
    }
}
GluttonousSnake.prototype._gridFill = function(x, y, isColor, i) {
    var color_1 = i % 2 == 1 ? '#3e3227' : '#372c22'      
    var color_2 = i % 2 != 1 ? '#3e3227' : '#372c22'
    
    var fillStyle = isColor % 2 == 1 ? color_1 : color_2
    this.ctx.fillStyle = fillStyle
    this.ctx.fillRect (x, y, this.grid, this.grid);
}

GluttonousSnake.prototype.drawFruit = function(x, y) {
    var fruitImage = new Image()
    fruitImage.src = './fruit.png'
    this.ctx.drawImage(fruitImage, x, y, this.grid, this.grid)
}

var snakeImage = (function() {
    var img = new Image()
    img.src = './snake.png'
    return img
})()

var directionWithAngle = function(direction) {
    if (direction === 't') {
        return 90
    } else if (direction === 'r') {
        return 180
    } else if (direction === 'b') {
        return 270
    } else {
        return 0
    }
}
// 蛇头
GluttonousSnake.prototype.drawSnakeHead = function(x, y, direction) {
    this.ctx.save()
    var cx = x + this.grid/2
    var cy = y + this.grid/2
    
    this.ctx.translate(cx, cy)
    this.ctx.rotate(directionWithAngle(direction) * Math.PI / 180)
    this.ctx.drawImage(snakeImage, 0, 0, this.grid, this.grid, -this.grid/2, -this.grid/2, this.grid, this.grid)
    this.ctx.restore()
}
// 蛇身
GluttonousSnake.prototype.drawSnakeBody = function(x, y) {
    this.ctx.drawImage(snakeImage, 18, 0, this.grid, this.grid, x, y, this.grid, this.grid)
}
// 蛇尾
GluttonousSnake.prototype.drawSnakeTail = function(x, y, direction) {
    this.ctx.save()
    var cx = x + this.grid/2
    var cy = y + this.grid/2
    
    this.ctx.translate(cx, cy)
    this.ctx.rotate(directionWithAngle(direction) * Math.PI / 180)
    this.ctx.drawImage(snakeImage, 36, 0, this.grid, this.grid, -this.grid/2, -this.grid/2, this.grid, this.grid)
    this.ctx.restore()
}
// 入场2017
GluttonousSnake.prototype._drawEntry_2017 = function() {
    this.ctx.save()
    this.ctx.translate(4 * this.grid, this.grid * 10)

    for (var i = 0; i < this.map_2017.length; i++) {
        var l = this.map_2017[i].length
        for (var j = 0; j < l; j++) {
            var k = this.map_2017[i][j]
            var w = j * this.grid
            var h = i * this.grid
            var direction = null
            if (typeof k != 'number') {
                direction = k[1]
                k = k[0]
            }
            if (k === 1) {
                this.drawFruit(w, h)
            } else if (k === 2) {
                this.drawSnakeHead(w, h, direction)
            } else if (k === 3) {
                this.drawSnakeBody(w, h)
            } else if (k === 4) {
                this.drawSnakeTail(w, h, direction)
            }
        }
    }

    this.ctx.restore()
}

// 绘制游戏结束
GluttonousSnake.prototype._drawOver = function(x, y) {
    var overImage = new Image()
    overImage.src = './over.png'
    overImage.onload = () => {
        this.ctx.fillStyle = 'rgba(55,44,34,0.7)'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.drawImage(overImage, (450 - 255) / 2, (450 - 163) / 2, 255, 163)
    }
}

// 重置文字及参数
GluttonousSnake.prototype._overGame = function() {
    this.isOverGame = true
    this.isInGame = false
    document.querySelector('.game-button').innerHTML = '再来'
    this.overAudioPlay()
}

GluttonousSnake.prototype.eatAudioPlay = function() {
    var eatAudio = document.querySelector('.eat-audio')
    this.isOpenAudio && eatAudio.play()
}

GluttonousSnake.prototype.overAudioPlay = function() {
    var overAudio = document.querySelector('.over-audio')
    this.isOpenAudio && overAudio.play()

    var snakeAudio = document.querySelector('.snake-audio')
    this.isOpenAudio && snakeAudio.pause()
}