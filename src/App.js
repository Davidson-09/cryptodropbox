import './App.css';
import Web3 from 'web3'
import React, {useState, useEffect} from 'react'
import configFile from './config.json'

const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient.create({host: 'ipfs.infura.io', port: 5001, protocol:'https'});
console.log(ipfsClient)
console.log(ipfs)


function App() {

	const [address, setAddress] = useState('');
	const [fileDes, setFileDes] = useState(''); // file description
	const [newFile, setNewFile] = useState({})
	const [ready, setReady] = useState(true)
	const [showAlert, setShowAlert] = useState(false)
	const [message, setMessage] = useState('')
	const [dropbox, setDropBox] = useState()
	const [fileList, setFileList] = useState([])
	const [fileCount, setFileCount] = useState(0)

	useEffect(()=>{
		loadWeb3();
	}, [])

	const loadWeb3 =async()=>{
		console.log('loading the block...')
		const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
		console.log(web3)
		console.log('loading..')
		const network = await web3.eth.net.getNetworkType();
		console.log('network:', network)
		console.log(web3.eth)
		const accounts = await web3.eth.getAccounts();
		console.log(accounts);
		if (accounts.length === 0){
			window.alert('please connect your metamask wallet')
		} else{
			setAddress(accounts[0])
		}
		loadBlockchainDate(web3)
	}

	const loadBlockchainDate = async (web3)=>{
		const dropbox = new web3.eth.Contract(configFile.ABI, configFile.CONTRACT_ADDRESS);
		setDropBox(dropbox)
		const fileCount = await dropbox.methods.fileCount().call()
		setFileCount(fileCount)

		// get files
		var files = []
		for (let i=fileCount; i>0; i--){
			const file = await dropbox.methods.files(i).call();
			files.push({fileName: file.fileName, fileDescription: file.fileDescription});
			if (i==1){
				setFileList(files)
				console.log(files);
			}
		}
	}

	const uploadFile = async (e)=>{
		e.preventDefault()
		if (newFile !== {}){
			console.log('adding....')
			setMessage('uploading...')
			await ipfs.add(newFile.buffer).then((result)=>{
				console.log(result)
				dropbox.methods.uploadFile(result.path, result.size, newFile.type, newFile.name, fileDes).send({from: address}).
					on('transactionHash', (hash) =>{
						reset();
						// get files
						var count = fileCount;
						setFileCount(fileCount + 1)
						var files = []
						for (let i=count; i>0; i--){
							const file = await dropbox.methods.files(i).call();
							files.push({fileName: file.fileName, fileDescription: file.fileDescription});
							if (i==1){
								setFileList(files)
								console.log(files);
							}
						}
					})
				setMessage('file uploaded successfully')

			}).catch((err)=>{
				console.log(err)
				setMessage('error uploading file')
			})
		}
	}

	const hiddenFileInput = React.useRef(null);

	const handleClick = event => {
		if (fileDes.trim() !== ''){
			hiddenFileInput.current.click();
		}
		
	};

	const reset =()=>{
		setFileDes('')
		setMessage('')
		setNewFile({})
		setShowAlert(false)

	}

	const handleMedia =(e)=>{
		e.preventDefault();
		if (e.target.files[0]){
			const file = e.target.files[0]
			const reader = new window.FileReader();

			reader.readAsArrayBuffer(file);
			reader.onloadend =()=>{
				setNewFile({
					buffer: Buffer(reader.result),
					type: file.type,
					name: file.name
				})
				console.log(Buffer(reader.result))
				setShowAlert(true);
				setMessage('file selected');
			}
			// setMedia(e.target.files[0])
			// setDisplayButton(false)
			// setShowPreview(true);
		}
	}

	function FileItem({file}){
		return(
			<div style={{marginBottom:'.5em', backgroundColor:'white', width:'70%', marginRight:'auto',
					marginLeft:'auto'}}>
				<p style={{margin:'0', color:'blue', fontSize:'1.5em', fontWeight:'bold'}}>{file.fileDescription}</p>
				<p style={{margin:'0', fontSize:'.7em'}}>{file.fileName}</p>
			</div>
		)
		
	}

	return (
		<div className="App" style={{backgroundColor:'grey', height:'100vh'}}>
			<div style={{backgroundColor:'blue', width:'100%', height:'3em'}}>
				<p style={{fontSize:'1.5em', fontWeight:'bold', color:'white', textAlign:'left',
					marginTop:'0', marginLeft:'.5em'}}>CryptoDropBox</p>
			</div>
			<p style={{fontSize:'.7em', textAlign:'left'}}><span style={{fontWeight:'bold'}}>Your address: </span>{address}</p>
			<form style={{marginTop:'1em', backgroundColor:'black', width:'70%', marginLeft:'auto', marginRight:'auto'}}
				onSubmit={uploadFile}>
				<div style={{width:'100%', padding:'0'}}>
					<p style={{color:'white', fontSize:'1.5em', fontWeight:'bold'}}>Share File</p>
					<input style={{border:'none', fontSize:'1em', width:'60%'}} 
					placeholder='input file description' value={fileDes} onChange={(e)=>{setFileDes(e.target.value)}}/>
					<button style={{color:'white', backgroundColor:'blue', border:'none', fontSize:'1em'}}
					onClick={handleClick}>choose file</button>
					<input required type='file' onChange={handleMedia} ref={hiddenFileInput} style={{display:'none'}} />
				</div>
				{ready && (<button style={{color:'white', backgroundColor:'blue', border:'none', fontSize:'1em',
							width:'100%', marginTop:'1em'}} type='submit'>upload</button>)}
			</form>
			{showAlert && <p>{message}</p>}
			<div style={{marginTop:'1em'}}>
				{fileList.map(file=>
					<FileItem file={file}/>)}
			</div>
		</div>
	  );
}

export default App;
