export function validateEnquiry(input, documents, productIds) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid submission.');
  const text = (key, max, required=false) => {
    const value=input[key];
    if(value!=null && typeof value!=='string')throw new Error(`Invalid ${key}.`);
    const clean=(value||'').trim();
    if(clean.length>max || (required && !clean))throw new Error(`Please check ${key}.`);
    return clean;
  };
  const kind=text('kind',30,true);
  if(!['tds_download','product_enquiry','general_enquiry'].includes(kind))throw new Error('Invalid enquiry type.');
  const name=text('name',100,true),email=text('email',254,true).toLowerCase(),mobile=text('mobile',24,kind==='tds_download');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid email address.');
  if(mobile && (!/^[+\d\s()-]+$/.test(mobile)||!/^\d{10,15}$/.test(mobile.replace(/\D/g,''))))throw new Error('Enter a valid mobile number.');
  const requestId=text('requestId',36,true);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))throw new Error('Invalid request ID.');
  const productId=text('productId',100),documentPath=text('documentPath',200);
  if(productId && !productIds.includes(productId))throw new Error('Unknown product.');
  if(kind==='tds_download' && !Object.hasOwn(documents,documentPath))throw new Error('This document is not available.');
  const message=text('message',2500,kind!=='tds_download');
  return {requestId,payload:{kind,name,email,mobile,productId,documentPath:kind==='tds_download'?documentPath:'',productName:text('productName',300),message,company:text('company',160),city:text('city',100),requirements:text('requirements',2500),topic:text('topic',100)}};
}
