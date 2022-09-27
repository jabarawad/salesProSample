import React, { useRef, useState } from "react";
import './Product.css'
import { Form, Button, Alert } from "react-bootstrap"
import { Link, useHistory } from 'react-router-dom';
import 'firebase/database'
import firebase from "firebase";
import { useAuth } from '../../contexts/AuthContext'

export default function Product() {
  const introOneRef = useRef();
  const introTwoRef = useRef();
  const introThreeRef = useRef();
  const introFourRef = useRef();
  const notesRef = useRef();
  const [error, setError] = useState('');
  const [question, setQuestion] = useState(['', '', '', '', '']);
  const [countNumerator, setCountNumerator] = useState(0);
  const [clicked, setClicked] = useState([false, false, false, false]);
  const [notes, setNotes] = useState("");
  const [company, setCompany] = useState("none");
  const { currentUser, updateIntroQuestions, updateNotes } = useAuth();
  const [loading, setLoading] = useState(false)
  const [admin, setAdmin] = useState('')
  const [activeCompany, setActiveCompany] = useState('')
  const history = useHistory();

  /* Get currentUser company */
  const dbRef = firebase.database().ref();
  React.useMemo(() => {
    if (currentUser) {
      dbRef.child("users").child(currentUser.uid).child('/activeCompany').get().then((snapshot) => {
        setCompany(snapshot.val())
      }).catch((error) => {
        console.error(error);
      });

      for (var i = 1; i < 5; i++) {
        console.log(i)
        dbRef.child("questions").child(company).child("intro-questions").child("question" + i.toString()).get().then((snapshot) => {
          const dummy = question;
          dummy[i] = snapshot.val()
          setQuestion(dummy)
        }).catch((error) => {
          console.error(error);
        });
      }

      dbRef.child("notes").child(company).child(currentUser.uid).child('/note').get().then((snapshot) => {
        setNotes(snapshot.val())
      }).catch((error) => {
        console.error(error);
      });

      dbRef.child("users").child(currentUser.uid).child('/activeCompany').get().then((snapshot) => {
        setActiveCompany(snapshot.val())
      }).catch((error) => {
        setError(error);
      });

      dbRef.child("companies").child('/' + activeCompany).child('/admin').get().then((snapshot) => {
        setAdmin(snapshot.val())
      }).catch((error) => {
        setError(error);
      });
    }

  }, [setActiveCompany, setAdmin, setNotes, setCompany, setQuestion, dbRef]);

  async function handleNonAdminSubmit(e) {
    // when a non-admin user submits a questions form
    // ensure they have clicked on the prompts
    e.preventDefault()
    setLoading(true)
    setError("")
    var count = 0;
    var list_of_clickables = clicked.slice(1);

    for (var i = 0; i < list_of_clickables.length; i++) {
      if (list_of_clickables[i]) {
        count += 1
      }
    }
    if (count < 1) {
      setLoading(false)
      return setError("You must ask and select at least one question")
    }
    updateNotes(notesRef.current.value)
    setLoading(false)
    history.push('/product/pain')
  }

  function handleClick(e, n) {
    // if a user is not an admin, update when they click on a question
    e.preventDefault()
    if (!clicked[n]) {
      setClicked[n](true)
      setCountNumerator(countNumerator + 1)
    } else if (clicked[n]) {
      setClicked[n](false)
      setCountNumerator(countNumerator - 1)
    } else {
      setClicked[n](null)
    }
  }

  async function handleSubmit(e) {
    // when a user is an admin
    e.preventDefault()
    setLoading(true)
    setError("")
    const promises = []
    // update the user's questions to the db
    promises.push(updateIntroQuestions(introOneRef.current.value, introTwoRef.current.value, introThreeRef.current.value, introFourRef.current.value));
    console.log('we pushed the info')
    Promise.all(promises).then(() => {
    }).catch(() => {
      setError('Failed to update questions, try logging out and logging in again')
    }).finally(() => {
      setLoading(false)
      if (!loading) { history.push('/product/pain') }
    })
  }

  if (currentUser.email === admin) {
    return (
      <div className="product-page">
        <div className="base-container">
          <div className="content">
            <h1 className="title">Introduction Questions</h1>
            <h3 className="instructions">Please enter one or more questions</h3>
            {error && <div className="alert-box"><Alert className="danger">{error}</Alert></div>}
            <p className="product-instructions">Note: Your employees will ask these questions to clients, try to make them specific to your company</p>
            <Form className="form" onSubmit={handleSubmit} >
              <Form.Group id="q1" className="form-group">
                <Form.Label>Intro Question 1:</Form.Label>
                <Form.Control type="text" placeholder="Please enter a question..." ref={introOneRef} required defaultValue={question[1]} />
              </Form.Group>
              <Form.Group id="q2" className="form-group">
                <Form.Label>Intro Question 2:</Form.Label>
                <Form.Control type="text" placeholder="Please enter a question..." ref={introTwoRef} defaultValue={question[2]} />
              </Form.Group>
              <Form.Group id="q3" className="form-group">
                <Form.Label>Intro Question 3:</Form.Label>
                <Form.Control type="text" placeholder="Please enter a question..." ref={introThreeRef}
                  defaultValue={question[3]} />
              </Form.Group>
              <Form.Group id="q4" className="form-group">
                <Form.Label>Intro Question 4:</Form.Label>
                <Form.Control type="text" placeholder="Please enter a question..." ref={introFourRef}
                  defaultValue={question[4]} />
              </Form.Group>
              {!loading && <Button className="btn" type="submit">
                Next Page
              </Button>}
              <Link to="/product" className="switch-tab"><span className="login-register-switch">Go Back</span></Link>
            </Form>
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <div className="product-page">
        <div className="base-container">
          <div className="content" >
            <h1 className="title">Introduction Questions</h1>
            <h3 className="instructions">Click on a question, and ask that question to the client</h3>
            <div className="counter">{countNumerator} question(s) selected</div>
            <Form className="form" onSubmit={handleNonAdminSubmit}>
              <div className="border">
                {question[1] ? <div className="clickable" onClick={handleClick(1)} id={clicked[0]}>{question[1]}</div> : null}
                {question[2] ? <div className="clickable" onClick={handleClick(2)} id={clicked[1]}>{question[2]}</div> : null}
                {question[3] ? <div className="clickable" onClick={handleClick(3)} id={clicked[2]}>{question[3]}</div> : null}
                {question[4] ? <div className="clickable" onClick={handleClick(4)} id={clicked[3]}>{question[4]}</div> : null}
              </div>
              <Form.Group className="notes">
                <Form.Label>Notes (optional but encouraged):</Form.Label>
                <textarea type="text" placeholder="E.x. client unsure of how to answer question 1..." ref={notesRef} defaultValue={notes} />
              </Form.Group>
              {error && <div className="alert-box"><Alert className="danger">{error}</Alert></div>}
              {!loading && <Button className="btn" type="submit">
                Next Page
              </Button>}
            </Form>
            <Link to="/product" className="switch-tab"><span className="login-register-switch">Go Back</span></Link>
          </div>
        </div>
      </div>
    )
  }
}
