import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs , doc, updateDoc} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase'

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [image, setImage] = useState(null);
  const [newContact, setNewContact] = useState({ name: '', lastContactDate: '', profilePic: '' });
  const [contacts, setContacts] = useState([]);

  const handleInputChange = event => {
    const { name, value, files } = event.target;
    if (files && files[0]) {
      setImage(files[0]);
    } else {
      setNewContact({ ...newContact, [name]: value });
    }
  };

  const handleFormSubmit = async event => {
    event.preventDefault();
    if (newContact.id) {
      // Update existing contact
      await updateContact();
    } else {
      // Add new contact
      const imageRef = ref(storage, `images/${image.name}`);
      await uploadBytes(imageRef, image);
      const imageUrl = await getDownloadURL(imageRef);
      try {
        const contactData = { ...newContact, profilePic: imageUrl };
        const docRef = await addDoc(collection(db, 'contacts'), contactData);
        console.log('New Contact ID:', docRef.id);
        setContacts([...contacts, { ...contactData, id: docRef.id }]);
        setNewContact({ name: '', lastContactDate: '', profilePic: '' });
        setImage(null);
        setShowForm(false);
      } catch (error) {
        console.error('Error saving contact:', error);
      }
    }
  };

  const openContactViewForm = contact => {
    setNewContact(contact);
    setShowForm(true);
  };

  useEffect(() => {
    const fetchContacts = async () => {
      const querySnapshot = await getDocs(collection(db, 'contacts'));
      const contactsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContacts(contactsData);
    };

    fetchContacts();
  }, []);

  const updateContact = async () => {
    try {
      const contactRef = doc(db, 'contacts', newContact.id);
      const updatedContact = { ...newContact };
      if (image) {
        const imageRef = ref(storage, `images/${image.name}`);
        await uploadBytes(imageRef, image);
        updatedContact.profilePic = await getDownloadURL(imageRef);
      }
      await updateDoc(contactRef, updatedContact);
      console.log('Contact updated successfully');
      setContacts(contacts.map(contact => (contact.id === newContact.id ? updatedContact : contact)));
      setShowForm(false);
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  return (
    <div style={{ backgroundColor: '#f2f2f2', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', width: '80%', maxWidth: '800px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: '0' }}>Contacts</h2>
          <button onClick={() => setShowForm(true)} style={{ backgroundColor: '#007bff', color: '#ffffff', border: 'none', borderRadius: '5px', padding: '10px 15px', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '5px' }}>+</span> Add Contact
          </button>
        </div>
        {contacts.map(contact => (
          <div key={contact.id} style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '10px', marginBottom: '20px', cursor: 'pointer' }} onClick={() => openContactViewForm(contact)}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={contact.profilePic} alt={contact.name} style={{ width: '100px', height: '100px', borderRadius: '50%', marginRight: '20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ fontWeight: 'bold' }}>{contact.name}</div>
                <div>{contact.lastContactDate}</div>
              </div>
            </div>
          </div>
        ))}
        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <form onSubmit={handleFormSubmit} style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', width: '50%', maxWidth: '400px' }}>
              <h2 style={{ textAlign: 'center' }}>{newContact.id ? 'Edit Contact' : 'Add Contact'}</h2>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block' }}>Name:</label>
                <input type="text" name="name" value={newContact.name} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} required />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block' }}>Upload Profile:</label>
                <input type="file" name="profilePic" accept="image/*" onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
                {newContact.profilePic && !image && (
                  <img src={newContact.profilePic} alt={newContact.name} style={{ width: '100px', height: '100px', borderRadius: '50%', marginTop: '10px' }} />
                )}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block' }}>Last Contact Date:</label>
                <input type="date" name="lastContactDate" value={newContact.lastContactDate} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} required />
              </div>
              <button type="submit" style={{ backgroundColor: '#007bff', color: '#ffffff', border: 'none', borderRadius: '5px', padding: '10px 15px', width: '100%', cursor: 'pointer' }}>{newContact.id ? 'Update' : 'Save'}</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ backgroundColor: '#6c757d', color: '#ffffff', border: 'none', borderRadius: '5px', padding: '10px 15px', width: '100%', cursor: 'pointer', marginTop: '10px' }}>Cancel</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}