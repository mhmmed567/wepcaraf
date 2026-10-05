export class JsonBodyError extends Error {
  constructor(public status:number, message:string){super(message)}
}

export async function readJsonLimited(request:Request,maxBytes=200000):Promise<unknown>{
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new JsonBodyError(415,'أرسل بيانات JSON');
  const declared=Number(request.headers.get('content-length')||0);
  if(declared>maxBytes)throw new JsonBodyError(413,'الطلب كبير جدًا');
  if(!request.body)throw new JsonBodyError(400,'بيانات غير صالحة');
  const reader=request.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});
  let total=0,text='';
  try{
    while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>maxBytes){await reader.cancel();throw new JsonBodyError(413,'الطلب كبير جدًا')}text+=decoder.decode(value,{stream:true})}
    text+=decoder.decode();
    return JSON.parse(text);
  }catch(error){if(error instanceof JsonBodyError)throw error;throw new JsonBodyError(400,'بيانات غير صالحة')}
}
