import React,{useState,useEffect,useRef} from 'react';
import interceptor from '../Services/Interceptor';
import { makeStyles, InputAdornment, TextField, Card, Avatar, Snackbar, IconButton } from '@material-ui/core';
import StarsIcon from '@material-ui/icons/Stars';
import CloseIcon from '@material-ui/icons/Close'
import PersonOutlineIcon from '@material-ui/icons/PersonOutline'
import SendIcon from '@material-ui/icons/Send';
import { getCoords } from '../Services/emergency'
import MicIcon from '@material-ui/icons/Mic';
import MicNoneIcon from '@material-ui/icons/MicNone';
import Loader from './loader';

const useStyles = makeStyles({
  behindText:{
    position:'fixed',
    bottom:0,
    width:"100%",
    height:"81px",
    backgroundColor:"#f2f2f2",
  },
  textField:{
    position:'fixed',
    bottom:15,
    width:"90%",
    marginLeft:"5%",
    left:0,
    backgroundColor:"#fff",
  },
  botChatCont:{
    left:0,
    width:"100%",
    marginTop:"20px",
    display:'flex',
  },
  botReply:{
    backgroundColor:"#262626",
    color:"#fff",
    maxWidth:"60%",
    // wordBreak:'break-all',
    padding:"10px",
    marginLeft:"10px",
    // overflowWrap: 'break-word',
    // wordWrap: 'break-word',
    hyphens: 'auto',
  },
  botAvatar:{
    color:"#fff",
    backgroundColor:"#262626",
    marginLeft:"10px"
  },
  userChatCont:{
    width:"100%",
    display:'flex',
    marginTop:"20px",
  },
  userReply:{
    backgroundColor:"#fff",
    color:"#262626",
    maxWidth:"60%",
    // wordBreak:'break-all',
    padding:"10px",
    marginRight:"10px",
    marginLeft:'auto',
  },
  userAvatar:{
    color:"#262626",
    backgroundColor:"#fff",
    marginRight:"10px"
  },
  chatCont:{
    top:110,
    bottom:90,
    width:"100%",
    overflowY:"scroll",
    position:"fixed",
  }
})

function Chatbot() {
  const WelcomMessage=`Hello, PoliceBot here! I am a chatbot designed to register crimes, help you
  in difficult situations and create crime awarness! To request immediate police presence at your location, type 100. Type policebot for more features.`
  const [chatHistory,setChatHistory] = useState([{type:'bot',message:WelcomMessage}]);

  const [listening, setListening] = useState(false);
  let speechNotAvailable=null;
  if (!('webkitSpeechRecognition' in window)) {
    speechNotAvailable="Speech to text not available please use google chrome"
  }else{

    var SpeechRecognition = window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
    recognition.interimResults = false;

    recognition.onresult = async function(event) {
        var last = event.results.length - 1;
        var command = event.results[last][0].transcript;
        setListening(false);
        if(command==="emergency"){
          await getCoords();
          await setChatHistory([...chatHistory,{type:"user",message:command},{type:"bot",message:"I have sent your coordinates to the policemen! Dont panic help is on its way"}])
          // await setDisabled(false)
          setUserChat('')
          inputRef.current.focus()
          return;
        }
        else
          setUserChat(command)
    };

    recognition.onspeechend = function() {
        recognition.stop();
    };

    recognition.onerror = function(event) {
      console.log('Error occurred in recognition: ' + event.error);
    }        

  }


  const classes = useStyles()
  const [userChat,setUserChat]=useState('');
  // const [isChatDisabled,setDisabled] = useState(false)
  const [askImage,setAskImage] = useState(false)
  const [isSnackBarOpen,setSnackBar] = useState(false)
  const chatEndRef = React.createRef()
  const[image,setImage] = useState();
  const [caseNo,setCaseNo] = useState();
  var asked=false;
  const [loading,setLoading] = useState(false)

  const uploadImage = async e=>{
    setLoading(true)
    e.preventDefault();
    const formData = new FormData()
    formData.append('image',image);
    formData.append('caseNo',caseNo);
    try {
      let token = localStorage.getItem("Token");
      token = JSON.parse(token);
      const response = await fetch('/api/image-upload',{
        method:"POST",
        headers:{
          'authorization':`Bearer ${token}`,
        },
        body:formData
      }).then(res=>res.json());
      setLoading(false);
      setAskImage(false);
      setChatHistory([...chatHistory,{type:"bot",message:"Your image has been uploaded, you can view your case information in the my cases tab"}])
    } catch (error) {
      // console.log(error);
      alert(error);
    }
  }
  
  const imageform = ()=>{
    if(askImage){
      return(
        <div className={classes.botChatCont}>
          <div className="Mssg"><Avatar className={classes.botAvatar}><StarsIcon /></Avatar></div>
          <Card className={[classes.botReply,"message"].join(' ')}>
          Please upload any relevant Images. <br/> Continue chatting to dismiss.<p></p>
          <form onSubmit={uploadImage}>
          <input required type="file" onChange={e=>{setImage(e.target.files[0])}}></input>
          <button type="submit">Submit</button>
          </form>
          </Card>
          {scrollDown()}
        </div>
      );
    }
  }

  const scrollDown = ()=>{
    if(loading===false){
    var elem = document.getElementById('scrolldiv');
    elem.scrollTop = elem.scrollHeight;
  }
  }

  const scrollToBottom = () => {
    if(loading===false){
    var elem = document.getElementById('scrolldiv');
    elem.scrollTop = elem.scrollHeight;
    var messagestest = document.getElementsByClassName("message");
    messagestest[messagestest.length-1].innerHTML = messagestest[messagestest.length-1].innerHTML.replace(/\\n/g, "<br />");
    messagestest[messagestest.length-1].innerHTML = messagestest[messagestest.length-1].innerHTML.replace(/\^/g, "<br />");
    if(messagestest[messagestest.length-1].innerHTML.includes("Crime registered case No")&&asked===false){
      setCaseNo(parseInt(messagestest[messagestest.length-1].innerHTML.substring(27)))
      setAskImage(true);
      asked=true
    }
    else{
      setAskImage(false)
    }
  }
  }

  useEffect(scrollToBottom,[chatHistory])

  const inputRef = useRef(null)

  // Function to get reply
  const getBotMsg=async e=>{
    inputRef.current.focus()
      const currentmsg = userChat
      setUserChat('')
      // setDisabled(true);

      if(!currentmsg.length ){
        setSnackBar(true);
        // await setDisabled(false)
        return;
      }

      await setChatHistory([...chatHistory,{type:"user",message:currentmsg}])
      const data = await interceptor('bot-reply',"POST",{MSG:currentmsg});
      if(data.emergency){
        await getCoords();
        await setChatHistory([...chatHistory,{type:"user",message:currentmsg},{type:"bot",message:"I have sent your coordinates to the policemen! Dont panic help is on its way"}])
        // await setDisabled(false)
        scrollToBottom();
        inputRef.current.focus()
        return;
      }


      setChatHistory([...chatHistory,{type:"user",message:currentmsg},{type:"bot",message:data.reply}]);
      // await setDisabled(false)
      scrollToBottom();
      inputRef.current.focus()
  }

  const checkListening = ()=>{
    if(!speechNotAvailable){
    if(listening===false )
      return <MicNoneIcon style={{paddingRight:"10px"}} onClick={()=>{setListening(true); recognition.start()}}/>
    else
      return <MicIcon style={{paddingRight:"10px"}} onClick={()=>{setListening(false); recognition.stop()}} />
    }else{
      alert(speechNotAvailable)
    }
  }

  // function to render chats
  const renderChat=({type,message},index)=>{
    if(type==="bot"){
      return(
        <div key={index} className={classes.botChatCont}>
          <div className="Mssg"><Avatar className={classes.botAvatar}><StarsIcon /></Avatar></div><Card className={[classes.botReply,"message"].join(' ')}>{message}</Card>
        </div>
      )
    }

    return (
      <div key={index} className={classes.userChatCont}>
        <Card className={classes.userReply}>{message}</Card><Avatar className={classes.userAvatar}><PersonOutlineIcon /></Avatar>
      </div>
    )
  }



  // event listner for enter key
  const onKeyPress = e=>{
    if(e.key==="Enter") {
      getBotMsg()
      e.preventDefault()
    }
  }

    const testRender = ()=>{
      if(loading===true)
        return <Loader open={true} />
      else
        return <> {chatHistory.map((item,index)=>renderChat(item,index))}
        {imageform()} </>
    }
  
    return (
      <>

      <div className={classes.chatCont} id="scrolldiv">
      {/* The main chat screen */}
        {testRender()}
        <div ref={chatEndRef} />
      </div>
      {/* Message box */}
        <div className={classes.behindText}>
            <TextField
            multiline
            rowsMax="2"
            placeholder="Message"
            variant="outlined"
            className={classes.textField}
            value={userChat}
            onKeyPress={onKeyPress}
            onChange={e=>setUserChat(e.target.value)}
            inputRef={inputRef}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {!speechNotAvailable?checkListening():null}
                  <SendIcon onClick={getBotMsg}/>
                </InputAdornment>
                
              ),
            }}
            />
            </div>
                   
        {/* Snackbar */}
        <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          open={isSnackBarOpen}
          autoHideDuration={6000}
          onClose={()=>setSnackBar(false)}
          message="Cannot send an empty message"
          action={
            <React.Fragment>
              <IconButton size="small" aria-label="close" color="inherit" onClick={()=>{setSnackBar(false); }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </React.Fragment>
          }
        />
      </>
    );
  
}

export default Chatbot;
