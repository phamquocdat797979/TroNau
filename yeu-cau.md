-Tên web app Trọ Nẫu(TroNau.vn), web app có mục đích là giúp sinh viên kiếm được trọ ưng ý tại quy nhơn.
-Web app này sẽ hướng đến 2 đối tượng chính sẽ là:
+ 2 đối tượng này đều có phần đăng ký,đăng nhập,quản lý tài khoản của mình
  +Sinh viên tìm phòng trọ:sẽ lên web app xem các được các thông tin mà chủ trọ cho thuê đăng,xem chi tiết được thông tin phòng đó nhưng không hiển thị địa chỉ chi tiết cũng như cách thức liên hệ với chủ trọ để không làm cho việc tạo ra web app này vô dụng,khi mà sinh viên muốn thông tin chính xác địa chỉ phòng và số điện thoại liên hệ thì phải đặt lịch để xem chi tiết được.Phần đặt lịch hẹn cho sinh viên thì phải phụ thuộc vào thời gian mà chủ trọ cho phép đặt lịch,khi đặt được lịch thì chủ trọ phải đồng ý thì thông tin chính xác địa chỉ và sdt chủ nhà mới hiện cho tài khoản sinh viên đã đặt lịch.
  +Chủ trọ đăng tin cho thuê phòng trọ: đối tượng này có nhiệm vụ là đăng thông tin phòng trọ cho thuê mà mình muốn cho thuê(gồm:thông tin địa chỉ chính xác gồm số nhà,đường,phường,tiền trọ/tháng,tiền nước,tiền điện,các khoản tiền khác,mục thông tin khác như là cọc bao nhiêu,hay chỉ cho nữ ạ hay chỉ cho 1 người ở chẳng hạn,mục để đăng hình ảnh trọ lên tối đa là 4 ảnh và nếu là video thì không quá 2 phút và chỉ được đăng 1 video thôi),có phần thời gian cho đặt lịch theo tuần và ngày giờ có thể đặt lịch để cho chủ trọ xem và xác nhận đồng ý lịch thì thông tin chi tiết địa chỉ nhà và sdt mới hiện cho tài khoản sinh viên đã đăng ký đặt lịch.
- một số chức năng cần có:
+đặt lịch cả phần sinh viên và chủ trọ phải real time để không xuất hiện tình trạng 2 tài khoản cùng đặt 1 mốc thời gian,người đặt trước thì hiển thị trước,phải hiển thị liền khi có tài khoản đặt lịch để cho chủ trọ biết để xác nhận.
+thông tin phòng trọ thì tài khoản sinh viên có thể vào đánh giá bình luận
+chủ trọ có thể chỉnh sửa bài đăng của mình hoặc xóa bài đăng nếu không muốn cho thuê nữa,phần thông tin này sẽ có phần đã cho thuê và còn trống phòng để chủ trọ chọn,nếu ở trạng thái đã cho thuê thì sẽ hiện thêm 1 dòng ghi chú để nếu như hợp đồng cho thuê gần hết thì chủ trọ có thể ghi là ngày tháng đó trọ sẽ trống để cho sinh viên biết được mà xem trước.
- Thêm một đối tượng nữa cho web app này là admin,admin sẽ là người duyệt các thông tin bài đăng của chủ trọ,admin sẽ trực tiếp xuống xem phòng và nếu thấy đúng hết với thông tin đã đăng thì duyệt bài đăng đó để nó hiển thị lên trang web.Admin có thêm một phần nữa là có thể cập nhật banner hiển thị trên trang web,phần banner này sẽ là 3 cái trượt gang liên tiếp qua lại sau 1 khoảng thời gian.
-Yêu cầu về giao diện trang web cũng như giao diện của admin:
+trang web phải không được xuất hiện bất kỳ icon hay emoji nào,phải là dạng text hết
+mỗi thông tin bài đăng thì phải bố trí cho hợp lý để không quá to hoặc quá nhỏ,1 hàng thì để 3 bảng thông tin bài đăng,
1 trang thì có tối đa là 9 bài đăng,phải có phần chuyển trang để chuyển trang tiếp theo chứ không dồn tất cả bài đăng vào 1 trang.
+phần lọc thì sẽ có phần theo giá,theo đường và theo phường
+không cần thanh tìm kiếm ở trang web
-yêu cầu về chất lượng web app:
+cơ sở dữ liệu thì có thể dùng Supabase bản miễn phí hay không hay là phải dùng cái khác,vì dữ liệu không phải chỉ có mỗi chữ không mà còn có ảnh,chỗ lưu mật khẩu tài khoản nữa,với lại tôi còn muốn nó vừa chạy được local mà tôi cũng muốn deploy lên vercel hay railway nữa.
+phần ngôn ngữ hay công nghệ thì phải giúp trang web hoạt động tốt và ổn định khi dùng web tránh việc giật lag hay tốn quá nhiều tài nguyên để load trang,phần này bạn đề xuất giúp tôi đi
+phần code trong các tệp của toàn bộ project của tôi phải không được xuất hiện bất kỳ icon hay emoji nào,nhưng bạn nhớ là nếu là tiếng việt thì phải có dấu nha,tôi thấy bạn hay gặp tình trạng là tôi yêu cầu không được xuất hiện bất kỳ icon hay emoji nào thì bạn lại biến toàn bộ tiếng việt thành tiếng việt không dấu hết.


