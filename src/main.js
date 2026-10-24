function calculateSimpleRevenue(purchase, _product) {
  const { discount, sale_price, quantity } = purchase;
	const  mathDiscount =   1 - (discount / 100);
	return sale_price * quantity * mathDiscount;
}

function calculateBonusByProfit(index, total, seller) {
	const {profit} = seller;
	if (index === 0) {
    return 0.15 * profit;
	} else if (index < 3) {
    return 0.1 * profit;
	} else if (index === total - 1) {
    return 0 * profit;
	} else {
    return 0.05 * profit;
	}
}

function analyzeSalesData(data, options) {
	const { calculateRevenue, calculateBonus } = options;

	if (!data
		//проверка на то, что в data есть массивы sellers, products и purchase_records
    || !Array.isArray(data.sellers)
    || !Array.isArray(data.products)						
    || !Array.isArray(data.purchase_records)
	  //проверка на то, что массивы не пустые
		|| data.sellers.length === 0
		|| data.products.length === 0
		|| data.purchase_records.length === 0  			
	) {
    throw new Error('Некорректные входные данные');
	}

	if (typeof options !== "object" || typeof calculateRevenue !== "function" || typeof calculateBonus !== "function") {
    throw new Error('Чего-то не хватает');
	}
	
	const sellerStats = data.sellers.map(seller => ({
  	// Заполним начальными данными
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {}
	}));

	const sellerIndex = sellerStats.reduce((result, item) => {
    result[item.id] = item;
		return result;
	}, {}); 

	const productIndex = data.products.reduce((result, item) => {
    result[item.sku] = item;
		return result;
	}, {}); 

	data.purchase_records.forEach(record => { 										// Чек 
    const seller = sellerIndex[record.seller_id];	 					// Продавец
    seller.sales_count += 1;
    seller.revenue += record.total_amount;

    // Расчёт прибыли для каждого товара
    record.items.forEach(item => {
      const product = productIndex[item.sku]; 							// Товар
      const cost = product.purchase_price * item.quantity; 	//себестоимость товара
      const revenue = calculateRevenue(item, product);			//выручка
      const price = revenue - cost; 												//итогова прибыль
    	seller.profit += price;																//вся прибыль продавца
      if (!seller.products_sold[item.sku]) { 								// Учёт количества проданных товаров
        seller.products_sold[item.sku] = 0;
      }
      // По артикулу товара увеличить его проданное количество у продавца
			seller.products_sold[item.sku] += item.quantity;
    });
 	});

	sellerStats.sort((seller1, seller2) => seller2.profit - seller1.profit)

	sellerStats.forEach((seller, index) => {
		const total = sellerStats.length; 															//всего продавцов в списке
    seller.bonus = calculateBonus(index, total, seller); 						// Считаем бонус
    seller.top_products = Object.entries(seller.products_sold)
			.map(([sku, quantity]) => ({sku, quantity}))
			.sort((items1, items2) => items2.quantity - items1.quantity)
			.slice(0, 10); 																								// Формируем топ-10 товаров
	});

	return sellerStats.map(seller => ({
    seller_id: seller.id, 											// Строка, идентификатор продавца
    name: seller.name, 													// Строка, имя продавца
    revenue: +seller.revenue.toFixed(2),					// Число с двумя знаками после точки, выручка продавца
    profit: +seller.profit.toFixed(2), 					// Число с двумя знаками после точки, прибыль продавца
    sales_count: seller.sales_count, 						// Целое число, количество продаж продавца
    top_products: seller.top_products, 					// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
    bonus: +seller.bonus.toFixed(2) 							// Число с двумя знаками после точки, бонус продавца
	}));
}
