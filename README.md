# YelpCamp_v2
專案網址：https://stormy-reef-61543.herokuapp.com/
![](https://i.imgur.com/JdclwoO.jpg)
此專案係完成Udemy課程「[The Web Developer Bootcamp 2021](https://www.udemy.com/course/the-web-developer-bootcamp/)」後運用課程中學習到的技術製作，使用full-stack開發+RESTful設定路由以及BootStrap5前端排版。
<br>
可以使用測試帳號試用網站，
帳號: admin
密碼: admin4
<br>
## 功能
- 使用者可以登入/註冊，註冊時支援會員上傳大頭貼
- 新增/修改/刪除地點，新增及修改時支援圖片新增/刪除
- 瀏覽地點頁面可以評分、按讚及留言，有Google Map顯示地理位置
- 登入後可以留言，作者可以刪除自己的留言
- 個人會員頁面，顯示username、email及發表過的地點
- 在登入的狀態中，可更換會員大頭貼
## Build With
- MongoDB Database
- RESTful, Express, Mongoose 寫路由及更新MongoDB資料
- Bcrypt 判別密碼及加密
- Multer, Multer-Storage-Cloudinary, Cloudinary 圖片儲存及上傳圖片(會員頭貼及地點圖片)
- Ejs 寫template
- Node-geocoder, Google Map Api 地址改為經緯度及顯示地圖
- connect-flash 顯示錯誤及成功的快閃資訊
- express-validator 設定註冊會員表單的帳密限制
- Heroku 部署專案
## 專案心得
為了檢核自己學習成效，我決定用現有的技術及觀念做一個與課程Project類似的專案(也就是[YelpCamp_v1](https://github.com/LunZaiZai0223/YelpCamp_v1))，所以開工前就給自己一個「如果遇到問題不要輕易回頭看影片」的挑戰。但...我很嫩...還是在寫圖片上傳+最後部署時有回去看教學影片...（不過這也讓我決定之後寫1.2個小玩具當作複習+整理筆記，要不然我應該很快又忘記XD)。這是我第一個完成的專案，寫的時候很好玩(卡住的時候也很爆炸)，但是完成就是爽。其實還有很多有趣的功能想要玩玩，但現在還太嫩，如果都要加上去那麼此專案的完成日便遙遙無期，之後學習到再加上去吧！
