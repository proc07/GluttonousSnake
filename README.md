## 前言
 在慕课网上看了 bobo 老师的两门canvas基础视频（有点意思），心里就忍不住想搞点事情，就这样诞生了。喜欢的话可以 star ！[在线游戏](https://gujel.csb.app/GluttonousSnake/index.html)

![image](https://user-images.githubusercontent.com/16809535/116174222-95ecc600-a740-11eb-877e-93669eead74b.png)

## 思路

### 数据格式

普通情况下的地图是个二维数组，里面的每个数字代表对于渲染的图形元素，但如果是蛇元素的图形，那将变成三维数组，[ Number, Direction ]，这是因为蛇的每一个 item 元素都是有不一样的方向

- 1 => 苹果
- 0 => 空白
- 2 => 蛇头
- 3 => 蛇身
- 4 => 蛇尾

```js
// 初始化渲染的图形 2017，对应上方图片
[
 [1, 0, 2, 3, 3, 0, 2,        3, 3, 0, 0, [2, 't'], 0, 2, 3, 3],
 [0, 0, 0, 0, 3, 0, [4, 'b'], 0, 3, 0, 0, 3,        0, 0, 0, 3],
 [0, 0, 3, 3, 3, 0, 3,        0, 3, 0, 0, 3,        0, 0, 0, 3],
 [0, 0, 3, 0, 0, 0, 3,        0, 3, 0, 0, 3,        0, 0, 0, 3],
 [0, 0, 3, 3, 4, 0, 3,        3, 3, 0, 0, [4, 't'], 0, 0, 0, [4, 't']]
]
```

### 蛇元素坐标图

我们用一个二维数组来表示整个蛇的每一个元素的 x，y 轴坐标，这样做的好处是

- 当我们吃到一个食物时，添加一个蛇元素坐标 [x, y] 到数组头部，增加蛇的长度。
- 可以区分蛇头、蛇身、蛇尾。第一个元素就是蛇头、最后既是蛇尾，那么在渲染时就方便很多。

### 绑定键盘事件 上下左右

- 当键盘按下的方向，与当前蛇正在行走的方向相同，不做处理。
- 如果当前蛇行走的方向为右边，此时按下键盘为左边时，不做处理。不能向相对方向移动，只能从相邻方向。

公式：（当前方向 keycode 值 - 上一次方向 keycode 值）取绝对值 === 2

- 设置一个准备的方向，防止快速多次按下切换方向。

例子：当前蛇在下方向行走，如果我们快速按下了 -> 左箭头按钮，在按下 -> 右箭头按钮，那么此时下一次走动的位置是右边。

### 如何计算出下一个移动到位置？

当我们拿到 `蛇元素坐标图` 的第一个 item 坐标，其实就是蛇头，我们更具上面的 `设置一个准备的方向` 方向来计算出下一个位置。

- 上 [x 轴 - 1, y 不变]
- 右 [x 不变  , y 轴 + 1]
- 下 [x 轴 + 1, y 不变]
- 左 [x 不变  , y 轴 - 1 ]

### 碰撞检测

有以下2种情况，更具上面 `计算出下一个移动到位置` 坐标来进行判断

#### 撞到墙了

这个也很简单，更具地图的坐标，如果 x,y 轴其中一个为 -1 或者大于地图的最大长度，那么就是超出了边界

#### 撞到自己了

循环 `蛇元素坐标图` 中的每一个数据，是否与 `计算出下一个移动到位置` 相同。

### 绘制蛇

当蛇在进行行走时，将尾部的元素删除，在往头部添加一个新的元素。

- 蛇头、蛇尾有4个方向，蛇身只有1个方向

此时的数据头部的第一个元素（蛇头）与第二个元素（上一次的蛇头位置）的 x y 轴坐标进行对比，计算出蛇头图形的方向。
同理，如果是蛇尾的话，那就与前一个元素（蛇身）对比。计算出蛇身的位置。

不同的是：蛇头以第2个元素做为中心点判断，蛇尾由前一个元素做为中心点判断对比。






