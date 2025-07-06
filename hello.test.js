const { hello }=require("./hello");
test("checking the function hello ",()=>{
    expect(hello()).toBe("hello");
}
)