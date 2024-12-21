import axios from 'axios';
import { compareAsc, format } from 'date-fns';
import { useCallback, useContext, useEffect, useState } from 'react'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useParams } from 'react-router-dom';
import { AuthContext } from '../providers/AuthProvider';
import Swal from 'sweetalert2';

const JobDetails = () => {
  const { user } = useContext(AuthContext)
  const [startDate, setStartDate] = useState(new Date());
  const [job, setJob] = useState({});
  const [error, setError] = useState(null);
  const { id } = useParams();

  const fetchJob = useCallback(async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/update/job/${id}`);
      setJob(data.result);
      // setStartDate(new Date(data.result.deadline))
      console.log(data.result)
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs');
    }
  }, [id])
  useEffect(() => {
    fetchJob();
  }, [fetchJob])

  if (error) {
    return <p>{error}</p>
  }
  const {
    title,
    deadline,
    category,
    min_price,
    max_price,
    description,
    buyer,
    _id
  } = job || {};

  // bids related functionalities
  const handleSubmit = async(e) => {
    e.preventDefault();
    const form = e.target;
    const price = form.price.value;
    const comment = form.comment.value;
    const email = user?.email;
    const bidDeadline = startDate;
    const bidId = _id;
    const buyerEmail = buyer?.email;
    const placedBid = { title, buyerEmail, category, price, comment, email, bidDeadline, bidId, status: 'pending' }

    // check bid validation permissions 
    if (user?.email === buyer.email) {
      return Swal.fire({
        title: "Action not permitted!",
        icon: "error",
        draggable: true
      });
    }

    // deadline validation for mini days to do the job
    if (compareAsc(new Date(), new Date(deadline)) === 1) {
      return Swal.fire({
        title: "Deadline over, placing bid is forbidden!",
        icon: "error",
        draggable: true
      });
    }
    // sellers deadline to complete the job after bid accepted by seller 
    if (compareAsc(new Date(startDate), new Date(deadline)) === 1) {
      return Swal.fire({
        title: "Offer a deadline within provided date!",
        icon: "error",
        draggable: true
      });
    }
    // default max price validation
    if (price > max_price) {
      return Swal.fire({
        title: `You shoudn't bid over max-price: $${max_price}!`,
        icon: "error",
        draggable: true
      });
    }

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/client/add-bid`, placedBid)
      console.log(data)
      form.reset();
      if (data.insertedId) {
        Swal.fire({
          title: "Bid Grant Successfully!",
          text: "You will be redirected to your placed bids.",
          showClass: {
            popup: `
            animate__animated
            animate__fadeInUp
            animate__faster
          `
          },
          hideClass: {
            popup: `
            animate__animated
            animate__fadeOutDown
            animate__faster
          `
          },
          willClose: () => { window.location.href = '/my-bids'; }
        });
      }
    } catch (error) {
      console.error("Error bidding form data:", error);
      Swal.fire({
        title: "Error",
        text: `${error.response.data.message || "There was an error submitting the bid. Please try again."}`,
        icon: "error",
        showClass: {
          popup: ` animate__animated animate__shakeX animate__faster `
        },
        hideClass: {
          popup: ` animate__animated animate__fadeOutDown animate__faster `
        }
      });
    }

    console.log(placedBid)
    // console.table({placedBid})
    // console.table(placedBid)
  }

  return (
    <div className='flex flex-col md:flex-row justify-around gap-5  items-center min-h-[calc(100vh-306px)] md:max-w-screen-xl mx-auto '>
      {/* Job Details */}
      <div className='flex-1  px-4 py-7 bg-white rounded-md shadow-md md:min-h-[350px]'>
        <div className='flex items-center justify-between'>
          {deadline && (
            <span className='text-sm font-light text-gray-800 '>
              Deadline: {format(new Date(deadline), "P")}
            </span>
          )}
          <span className='px-4 py-1 text-xs text-blue-800 uppercase bg-blue-200 rounded-full '>
            {category}
          </span>
        </div>

        <div>
          <h1 className='mt-2 text-3xl font-semibold text-gray-800 '>
            {title}
          </h1>

          <p className='mt-2 text-lg text-gray-600 '>
            {description}
          </p>
          <p className='mt-6 text-sm font-bold text-gray-600 '>
            Buyer Details:
          </p>
          <div className='flex items-center gap-5'>
            <div>
              <p className='mt-2 text-sm  text-gray-600 '>
                Name: {buyer?.name}
              </p>
              <p className='mt-2 text-sm  text-gray-600 '>
                Email: {buyer?.email}
              </p>
            </div>
            <div className='rounded-full object-cover overflow-hidden w-14 h-14'>
              <img
                referrerPolicy='no-referrer'
                src={buyer?.photo}
                alt=''
              />
            </div>
          </div>
          <p className='mt-6 text-lg font-bold text-gray-600 '>
            Range: ${min_price} - ${max_price}
          </p>
        </div>
      </div>
      {/* Place A Bid Form */}
      <section className='p-6 w-full  bg-white rounded-md shadow-md flex-1 md:min-h-[350px]'>
        <h2 className='text-lg font-semibold text-gray-700 capitalize '>
          Place A Bid
        </h2>

        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2'>
            <div>
              <label className='text-gray-700 ' htmlFor='price'>
                Price
              </label>
              <input
                id='price'
                type='text'
                name='price'
                required
                className='block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md   focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40  focus:outline-none focus:ring'
              />
            </div>

            <div>
              <label className='text-gray-700 ' htmlFor='emailAddress'>
                Email Address
              </label>
              <input
                id='emailAddress'
                type='email'
                name='email'
                defaultValue={user?.email}
                disabled
                className='block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md   focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40  focus:outline-none focus:ring'
              />
            </div>

            <div>
              <label className='text-gray-700 ' htmlFor='comment'>
                Comment
              </label>
              <input
                id='comment'
                name='comment'
                type='text'
                className='block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md   focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40  focus:outline-none focus:ring'
              />
            </div>
            <div className='flex flex-col gap-2 '>
              <label className='text-gray-700'>Deadline</label>

              {/* Date Picker Input Field */}
              <DatePicker
                className='border p-2 rounded-md'
                selected={startDate}
                onChange={date => setStartDate(date)}
              />
            </div>
          </div>

          <div className='flex justify-end mt-6'>
            <button
              type='submit'
              className='px-8 py-2.5 leading-5 text-white transition-colors duration-300 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600'
            >
              Place Bid
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default JobDetails
