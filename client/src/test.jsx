import React, { useEffect, useState } from "react";

const Test = () => {
  const [isShow, setIshow] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    // Lấy dữ liệu từ Local Storage khi component mount
    const storedData = JSON.parse(localStorage.getItem("countdown")) || [];
    setData(storedData);

    // Khởi tạo dữ liệu ban đầu nếu Local Storage trống
    if (storedData.length === 0) {
      const initStateLocal = [
        { key: 1, countDown: 10, isShow: false, image: "/public/test.jpg" },
        { key: 2, countDown: 10, isShow: false, image: "/public/test.jpg" },
        { key: 3, countDown: 10, isShow: false, image: "/public/test.jpg" },
        { key: 4, countDown: 10, isShow: false, image: "/public/test.jpg" },
      ];
      localStorage.setItem("countdown", JSON.stringify(initStateLocal));
    }
  }, []);

  useEffect(() => {
    let currentItemIndex = 0; // Biến để theo dõi chỉ mục của item đang được xử lý

    const intervalId = setInterval(() => {
      console.log(1111);
      let updatedData = [...data];
      let countdownEnded = false;

      // Kiểm tra xem còn item nào có countDown > 0 không
      for (let i = currentItemIndex; i < updatedData.length; i++) {
       
        if (updatedData[i].countDown > 0) {
          updatedData[i] = {
            ...updatedData[i],
            countDown: updatedData[i].countDown - 1,
          };
          countdownEnded = false;
          currentItemIndex = i; // Lưu chỉ số của item đang được xử lý
          break;
        } else if (
          i === updatedData.length - 1 &&
          updatedData[i].countDown === 0
        ) {
          countdownEnded = true;
        }
        
      }
      if(updatedData[currentItemIndex].countDown === 0) {
        localStorage.setItem("countdown", JSON.stringify(updatedData));
    } 
      if (countdownEnded) {
        // Cập nhật Local Storage khi countdown kết thúc cho item thứ nhất
        clearInterval(intervalId);
      } else {
        setData(updatedData);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [data]);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("countdown")) || [];
    setData(storedData);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        width: "100vh",
        height: "100vh",
      }}
    >
      <button
        style={{ height: "50px" }}
        onMouseEnter={() => setIshow(true)}
        // onMouseLeave={() => setIshow(false)}
      >
        hover
      </button>
      {isShow && (
        <div
          style={{
            border: "1px solid",
            width: "500px",
            height: "300px",
            display: "flex",
            gap: "4",
            padding: "5px",
          }}
        >
          {data &&
            data.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginRight: "10px",
                }}
              >
                <p>hidden</p>
                <p>{item.countDown}</p>
              </div>
            ))}
        </div>
      )}

      {/* <img src="/public/test.jpg" alt="" /> */}
    </div>
  );
};

export default Test;
