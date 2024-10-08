import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import CardFeature from "./CardFeature";
import FilterProduct from "./FilterProduct";

const AllProduct = ({ heading }) => {
  const productData = useSelector((state) => state.product.productList);
  const categoryList = [...new Set(productData.map((e1) => e1.category))];

  // filter data display
  const [filterby, setFilterBy] = useState("");
  const [dataFilter, setDataFilter] = useState([]);

  useEffect(() => {
    if (productData.length > 0) {
      setDataFilter(productData);
    }
  }, [productData]);

  // Inside AllProduct component
  const handleFilterProduct = (category) => {
    console.log(category);
    setFilterBy(category);
    const filter = productData.filter((e1) => {
      console.log("e1.category:", e1.category);
      return (
        e1.category && e1.category.toLowerCase() === category?.toLowerCase()
      );
      // Add the optional chaining operator (?.) to safely access the property
    });
    setDataFilter(() => [...filter]);
  };

  const loadingArrayFeature = new Array(10).fill(null);

  return (
    <div className="my-5">
      <h2 className="font-bold text-2xl text-slate-800 mb-4">{heading}</h2>

      <div className="flex gap-4 justify-center overflow-scroll scrollbar-none">
        <FilterProduct
          category="All"
          isActive={filterby.toLowerCase() === "all"}
          onClick={() => {
            setFilterBy("All");
            setDataFilter(productData);
          }}
        />
        {categoryList[0] ? (
          categoryList.map((e1) => {
            return (
              <FilterProduct
                category={e1}
                key={e1}
                isActive={e1.toLowerCase() === filterby.toLowerCase()}
                onClick={() => handleFilterProduct(e1)}
              />
            );
          })
        ) : (
          <div className="min-h-[150px] flex justify-center items-center">
            <p>Loading...</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4 my-4">
        {dataFilter[0]
          ? dataFilter.map((e1) => {
              return (
                <CardFeature
                  key={e1._id}
                  id={e1._id}
                  image={e1.image}
                  name={e1.name}
                  category={e1.category}
                  price={e1.price}
                />
              );
            })
          : loadingArrayFeature.map((_, index) => (
              <CardFeature loading="Loading..." key={index + "allProduct"} />
            ))}
      </div>
    </div>
  );
};

export default AllProduct;
