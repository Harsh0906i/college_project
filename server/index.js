const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { NlpManager } = require('node-nlp');
const mongoose = require('mongoose');
const BotSchema = require('./model/BotSchema');
// const Response = require('./model/response');
const app = express();
app.use(bodyParser.json());
app.use(cors());
main()
    .then(() => {
        console.log("success");
    }).catch((err) => {
        console.log(err);
    });
async function main() {
    // mongodb://localhost:27017/nlpData
    await mongoose.connect("mongodb+srv://harshitsingharya24:AlLLGk8qXY9fzHJA@cluster0.afo0r.mongodb.net/");
};
const manager = new NlpManager({ languages: ['en'] });


// const Response = require('./model/ResponseSchema');

// app.post('/addResponses', async (req, res) => {
//     const responses = req.body; // Array of responses
//     try {
//         await Response.insertMany(responses);
//         res.status(200).json({ message: 'Responses added successfully!' });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });


const loadTrainingDataFromDB = async () => {
    try {
        const data = await BotSchema.find();
        data.forEach(doc => {
            manager.addDocument(doc.language, doc.sentence, doc.intent);
        });

        await manager.train();
        await manager.save();
        console.log('Training completed and model saved!');
    } catch (err) {
        console.error('Error loading training data: ', err);
    }
};

loadTrainingDataFromDB();

// async function fetchGeneral() {
//     const query = await BotSchema.deleteMany({ intent: 'general.query' })
//     console.log(query)
// }

// fetchGeneral()

const addTrainingDataAndUpdateModel = async (language, sentence, intent) => {
    if (!language || !sentence || !intent) {
        throw new Error('Language, sentence, and intent are required.');
    }

    try {
        const newTrainingData = new BotSchema({ language, sentence, intent });
        await newTrainingData.save();

        manager.addDocument(language, sentence, intent);

        await manager.train();
        await manager.save();

        console.log('New training data added and model re-trained!');
    } catch (err) {
        console.error('Error saving new training data: ', err);
        throw new Error('Error saving new training data');
    }
};
app.get('/', (req, res) => {
    res.send('working!')
})
app.post('/addTrainingData', async (req, res) => {
    const data = req.body;

    if (!data) {
        return res.status(400).json({ error: 'No training data provided.' });
    }

    try {
        if (Array.isArray(data)) {
            for (const { language, sentence, intent } of data) {
                if (!language || !sentence || !intent) {
                    return res.status(400).json({ error: 'Missing required fields in training data.' });
                }
                await addTrainingDataAndUpdateModel(language, sentence, intent);
            }
        } else {
            const { language, sentence, intent } = data;
            if (!language || !sentence || !intent) {
                return res.status(400).json({ error: 'Missing required fields in training data.' });
            }
            await addTrainingDataAndUpdateModel(language, sentence, intent);
        }

        res.status(200).json({ message: 'Training data added and model updated.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/chat', async (req, res) => {
    const { message } = req.body;
    const response = await manager.process('en', message);
    let reply;

    if (response.score > 0.5) {
        console.log('Intent recognized: ', response.intent);
    } else {
        reply = "I'm sorry, I didn't understand that. Could you rephrase your question?";
        console.log('Uncertain, asking to rephrase');
    }

    if (response.intent === 'greeting') {
        reply = 'Hi there! How can I help you?';
    }

    else if (response.intent === 'bot.query') {
        const normalizedMessage = message.toLowerCase();

        if (normalizedMessage.includes('sica college') || normalizedMessage.includes('recommend')) {
            reply = "SICA College has its strengths and weaknesses, but it's important to consider your priorities, such as placements, facilities, and course offerings, before deciding. I'm just here to provide you the relevant details";
        }
        else if (normalizedMessage.includes('bye') || normalizedMessage.includes('by') || normalizedMessage.includes('goodbye') || normalizedMessage.includes('see you')) {
            reply = "The Terminator has left the chat... but remember, I'll be back! 💀";
        }
        else {
            reply = "I'm Terminator, your tech-savvy assistant. Ready to help, but I promise I won't terminate you! HAHAHAHA";
        }

    }

    else if (response.intent === 'admission.query') {
        reply = 'You can contact us at 8871729595 or 9669808182 for admission-related queries.';
    }

    else if (response.intent === 'contact.query') {
        if (message.toLowerCase().includes('contact number') || message.toLowerCase().includes('phone')) {
            reply = 'You can contact us at 0731-2974255, 8871729595, or 9669808182 for any inquiries related to admissions.';
        }
        else if (message.toLowerCase().includes('email') || message.toLowerCase().includes('email address')) {
            reply = 'Our official emails are: sicacollegeindore@gmail.com, antiragging@sicacollegeindore.com, grievance@sicacollegeindore.com.';
        }
        else if (message.toLowerCase().includes('located') || message.toLowerCase().includes('address') || message.toLowerCase().includes('location') || message.toLowerCase().includes('reach')) {
            reply = 'SICA College is located at Nipania Main Road, Near Iskcon Temple, ahead of Advanced Academy School, Indore, Madhya Pradesh 452010.';
        }
        else if (message.toLowerCase().includes('visit') ||
            message.toLowerCase().includes('timing') ||
            message.toLowerCase().includes('time to visit') ||
            message.toLowerCase().includes('office hours') ||
            message.toLowerCase().includes('working hours') ||
            message.toLowerCase().includes('schedule') ||
            message.toLowerCase().includes('hours')) {
            reply = "SICA College is open for visits from Monday to Saturday, 10:00 AM to 5:00 PM. On Sundays, the college is usually closed. Please contact the administration office to confirm availability before visiting.";
        }

        else {
            reply = 'You can contact us via the provided phone : 0731-2974255, 8871729595, or 9669808182 or reach out by email for any queries : sicacollegeindore@gmail.com, antiragging@sicacollegeindore.com, grievance@sicacollegeindore.com.';
        }
    }

    else if (response.intent === 'general.query') {
        const normalizedMessage = message.toLowerCase();

        // Check for different variations of the question related to SICA College
        if (normalizedMessage.includes('what is sica college') ||
            normalizedMessage.includes('about sica college') ||
            normalizedMessage.includes('who is sica college') ||
            normalizedMessage.includes('tell me about sica college') ||
            normalizedMessage.includes('overview')) {
            reply = 'SICA College is affiliated with Devi Ahilya Vishwavidyalaya and approved by M.P. Higher Education, Bhopal. It offers UG programs like B.Com, BBA, BCA, BAJMC, and BA, with a focus on holistic education, academic excellence, and personal development.';
        }
        else if (normalizedMessage.includes('parking') ||
            normalizedMessage.includes('park') ||
            normalizedMessage.includes('vehicle') ||
            normalizedMessage.includes('car') ||
            normalizedMessage.includes('space')) {
            reply = "Yes, SICA College provides parking facilities on campus. There is a designated parking area for students and staff. However, availability may vary depending on the time of day.";
        }
        else if (normalizedMessage.includes('wifi') || normalizedMessage.includes('wi-fi') || normalizedMessage.includes('internet')) {
            reply = "Yes, SICA College provides Wi-Fi on campus. However, the connectivity may vary in different areas. It is generally available for students in most parts of the campus.";
        }
        else if (normalizedMessage.includes('what is the aim of sica college') || normalizedMessage.includes('what is the goal of sica college') || normalizedMessage.includes('what is the mission of sica college')) {
            reply = 'The aim of SICA College is to provide a holistic education that fosters academic excellence, personal growth, and cultural values. We prepare students for successful careers and responsible citizenship through critical thinking and innovation.';
        }
        else if (normalizedMessage.includes('campus') || normalizedMessage.includes('big') || normalizedMessage.includes('large') || normalizedMessage.includes('size')) {
            reply = 'The campus of SICA College is not very large. It is shared with a school, and the space is more compact compared to other colleges. However, we focus on providing a strong educational experience in the available space.';
        }
        else if (normalizedMessage.includes('mission of sica college') || normalizedMessage.includes('vision of sica college')) {
            reply = 'SICA College’s mission is to provide students with a balanced approach to education, focusing on both academic achievement and personal development, while nurturing a sense of cultural responsibility and ethical values.';
        }
        else if (normalizedMessage.includes('affiliated') || normalizedMessage.includes('institution') || normalizedMessage.includes('approval')) {
            reply = 'SICA College is affiliated with Devi Ahilya Vishwavidyalaya and approved by M.P. Higher Education, Bhopal.';
        }
        else if (normalizedMessage.includes('unique') || normalizedMessage.includes('stand out')) {
            reply = 'SICA College stands out for its emphasis on holistic education, blending academic learning with personal development, cultural values, and social responsibility.';
        }
        else if (normalizedMessage.includes('faculty')) {
            reply = 'The faculty at SICA College is dedicated to the students growth, but we acknowledge that there is room for improvement. The focus is on providing personalized education and support.';
        }
        else if (normalizedMessage.includes('students')) {
            reply = 'SICA College has a smaller student population compared to other colleges. This allows for more individual attention and better student-teacher interaction.';
        }
        else if (normalizedMessage.includes('hostel')) {
            reply = 'Currently, SICA College does not offer hostel facilities.';
        }
        else if (normalizedMessage.includes('how long has sica college been in operation') ||
            normalizedMessage.includes('when was sica college established') ||
            normalizedMessage.includes('how many years has sica college been around') ||
            normalizedMessage.includes('since when has sica college been in existence') ||
            normalizedMessage.includes('when did sica college first open') ||
            normalizedMessage.includes('how old is sica college')) {
            reply = `SICA College has been in operation since 2013.`;
        }
        else if (normalizedMessage.includes('private')) {
            reply = 'SICA College is a private college affiliated to DAVV and approved by M.P. Higher Education, Bhopal.';
        }
        else {
            reply = 'SICA College offers a comprehensive education with a focus on academic excellence, personal growth, and cultural values.';
        }
    }

    else if (response.intent === 'fees.query') {
        const feesMapping = {
            bca: '₹50,000 per year',
            bba: '₹40,000 per year',
            bcom: '₹30,000 per year',
            bajmc: '₹45,000 per year',
            ba: '₹35,000 per year'
        };

        const normalizedMessage = message.toLowerCase();

        // Handle installment-related queries first
        if (normalizedMessage.includes('installments') ||
            normalizedMessage.includes('pay in parts') ||
            normalizedMessage.includes('split fees') ||
            normalizedMessage.includes('pay tuition fees') ||
            normalizedMessage.includes('installment plan')) {
            reply = "Yes, SICA College offers the option to pay fees in installments. Please contact the admissions office or the accounts department for more details on the installment plan.";
        }

        else if (normalizedMessage.includes('fee payment') ||
            normalizedMessage.includes('tuition fees') ||
            normalizedMessage.includes('fee schedule')) {
            reply = "SICA College allows students to pay their fees in installments. For further details on the fee payment schedule, please contact the accounts office.";
        }

        // Handle queries for Postgraduate (PG) courses
        else if (normalizedMessage.includes('pg') ||
            normalizedMessage.includes('master') ||
            normalizedMessage.includes('mba') ||
            normalizedMessage.includes('mca') ||
            normalizedMessage.includes('mtech') ||
            normalizedMessage.includes('msc') ||
            normalizedMessage.includes('ma') ||
            normalizedMessage.includes('mcom') ||
            normalizedMessage.includes('llm') ||
            normalizedMessage.includes('msw') ||
            normalizedMessage.includes('med')) {
            reply = 'Currently, SICA College does not offer any PG courses. However, MBA is an upcoming course and will be launched soon. Stay tuned for updates!';
        }
        else {
            // Handling fees for specific courses
            const courseNames = Object.keys(feesMapping);
            const matchedCourses = courseNames.filter(course => {
                const regex = new RegExp(`\\b${course}\\b`, 'i'); // Use word boundary to match the exact course
                return regex.test(normalizedMessage);
            });

            if (matchedCourses.length > 0) {
                const feesDetails = matchedCourses
                    .map(course => `${course.toUpperCase()} - ${feesMapping[course]}`)
                    .join(', ');
                reply = `The fees for the following UG courses are: ${feesDetails}.`;
            } else {
                const allFees = Object.entries(feesMapping)
                    .map(([course, fee]) => `${course.toUpperCase()} - ${fee}`)
                    .join(', ');
                reply = `The fees for our UG programs are as follows: ${allFees}. Fees are subject to change based on college policies.`;
            }

            // Handling more fee-related queries (e.g., fee payment schedule)

        }
    }

    else if (response.intent === 'course.query') {
        let courses = [];
        const normalizedMessage = message.toLowerCase();

        // Map full forms and keywords to short forms and responses
        const courseKeywords = {
            bca: 'BCA, a comprehensive course focusing on computer applications and software development.',
            'bachelor of computer applications': 'BCA, a comprehensive course focusing on computer applications and software development.',
            bba: 'BBA, focusing on business management and entrepreneurial skills.',
            'bachelor of business administration': 'BBA, focusing on business management and entrepreneurial skills.',
            bcom: 'B.Com, focusing on commerce, accounting, and business practices.',
            'bachelor of commerce': 'B.Com, focusing on commerce, accounting, and business practices.',
            bajmc: 'BAJMC, a multidisciplinary program in Journalism and Mass Communication.',
            'bachelor of arts in journalism and mass communication': 'BAJMC, a multidisciplinary program in Journalism and Mass Communication.',
            ba: 'BA, providing a foundation in the humanities with various subject options.',
            'bachelor of arts': 'BA, providing a foundation in the humanities with various subject options.'
        };

        if (normalizedMessage.includes('department') || normalizedMessage.includes('category') || normalizedMessage.includes('courses')) {
            reply = `SICA College has the following academic departments: 
            1. Computer Applications Department (BCA) 
            2. Business Administration Department (BBA) 
            3. Commerce Department (B.Com) 
            4. Journalism and Mass Communication Department (BAJMC) 
            5. Humanities Department (BA).`;
        }

        else if (normalizedMessage.includes('eligibility') || normalizedMessage.includes('eligblity') || normalizedMessage.includes('eligible')) {
            reply = 'You can contact us via the provided phone: 0731-2974255, 8871729595, or 9669808182 to check your eligibility for your desired course.';
        }
        // Handle duration-related queries
        else if (normalizedMessage.includes('duration') || normalizedMessage.includes('how long')) {
            reply = 'The duration of undergraduate (UG) courses at SICA College is typically 3 years, which includes 3 annual papers.';
        }

        // Check for PG-related queries
        else if (normalizedMessage.includes('pg') ||
            normalizedMessage.includes('master') ||
            normalizedMessage.includes('mba') ||
            normalizedMessage.includes('mca') ||
            normalizedMessage.includes('mtech') ||
            normalizedMessage.includes('msc') ||
            normalizedMessage.includes('ma') ||
            normalizedMessage.includes('mcom') ||
            normalizedMessage.includes('llm') ||
            normalizedMessage.includes('msw') ||
            normalizedMessage.includes('post graduate') ||
            normalizedMessage.includes('postgraduate') ||
            normalizedMessage.includes('med')) {
            reply = 'Currently, SICA College does not offer any postgraduate (PG) courses. However, we are planning to introduce PG courses in the future.';
        }

        else {
            const courseMatches = Object.keys(courseKeywords).filter(keyword =>
                normalizedMessage.split(' ').some(word => word === keyword) // Split and check exact words
            );

            if (courseMatches.length > 0) {
                courseMatches.forEach(match => {
                    courses.push(courseKeywords[match]);
                });
                reply = `SICA College offers the following UG courses: ${courses.join(' ')}`;
            } else {
                reply = 'Our UG programs include B.Com, BBA, BCA, BAJMC, and BA. Admissions are based on merit.';
            }
        }
    }

    else if (response.intent === 'placement.query') {
        reply = "SICA College provides basic placement assistance and training to its students. While the placement opportunities are still developing, the college focuses on equipping students with the skills needed to explore opportunities independently or pursue higher education.";
    }

    else if (response.intent === 'facility.query') {
        const normalizedMessage = message.toLowerCase();

        if (normalizedMessage.includes('library') || normalizedMessage.includes('books') || normalizedMessage.includes('reading material') || normalizedMessage.includes('liberary')) {
            reply = 'Yes, SICA College has a well-equipped library with a wide range of books, journals, and digital resources to support students learning and research needs.';
        }
        else if (normalizedMessage.includes('computer lab') || normalizedMessage.includes('labs') || normalizedMessage.includes('computers')) {
            reply = 'SICA College has a dedicated computer lab with modern computers and high-speed internet access, available for students to use for academic purposes.';
        }
        else if (normalizedMessage.includes('hostel')) {
            reply = 'Currently, SICA College does not offer hostel facilities.';
        }
        else if (normalizedMessage.includes('sports') || normalizedMessage.includes('game') || normalizedMessage.includes('play')) {
            reply = 'SICA College offers a variety of sports facilities including indoor and outdoor games. Students can enjoy sports like cricket, football, basketball, and more.';
        }
        else if (normalizedMessage.includes('wi-fi') || normalizedMessage.includes('wifi') || normalizedMessage.includes('internet')) {
            reply = 'Yes, SICA College provides Wi-Fi across the campus, ensuring students have access to the internet for academic and personal use. However, connectivity might vary in different areas of the campus.';
        }
        else if (normalizedMessage.includes('hostel') || normalizedMessage.includes('accommodation')) {
            reply = 'Currently, SICA College does not have hostel facilities, but there are nearby hostels and PG accommodations available for students.';
        }
        else if (normalizedMessage.includes('canteen') || normalizedMessage.includes('food') || normalizedMessage.includes('meal')) {
            reply = 'Yes, SICA College has a canteen that offers a variety of food options for students and staff.';
        }
        else if (normalizedMessage.includes('infrastructure') || normalizedMessage.includes('building') || normalizedMessage.includes('classroom')) {
            reply = 'SICA College have decent infrastructure, including classrooms, seminar halls, and study spaces.';
        }
        else if (normalizedMessage.includes('gym') || normalizedMessage.includes('fitness') || normalizedMessage.includes('exercise')) {
            reply = 'No, SICA College does not have gym facility.';
        }
        else if (normalizedMessage.includes('park') || normalizedMessage.includes('parking') || normalizedMessage.includes('vehicle')) {
            reply = 'Yes, SICA college offers parking facility for students and faculties.';
        }
        else if (normalizedMessage.includes('medical') || normalizedMessage.includes('healthcare') || normalizedMessage.includes('doctor')) {
            reply = 'SICA College provides basic medical facilities with a health center room.';
        }
        else if (normalizedMessage.includes('transport') || normalizedMessage.includes('bus')) {
            reply = 'SICA College provides transport facilities for students. There are buses operating from various locations to and from the campus.';
        }
        else if (normalizedMessage.includes('auditorium') || normalizedMessage.includes('event') || normalizedMessage.includes('seminar')) {
            reply = 'Yes, SICA College has a auditorium equipped with sound and lighting systems for hosting various cultural events.';
        }
        else if (normalizedMessage.includes('study room') || normalizedMessage.includes('quiet place') || normalizedMessage.includes('study area')) {
            reply = 'SICA College provides study rooms and quiet areas where students can focus on their academic work without distractions.';
        }
        else if (normalizedMessage.includes('extra-curricular') || normalizedMessage.includes('recreational') || normalizedMessage.includes('activities')) {
            reply = 'SICA College offers a wide range of extra-curricular activities including clubs, events, and competitions to encourage student participation and development.';
        }
        else if (normalizedMessage.includes('recreational') || normalizedMessage.includes('leisure') || normalizedMessage.includes('relaxation')) {
            reply = 'Yes, SICA College has recreational facilities for students, including sports facilities, and other places for students to unwind during breaks.';
        }
        else {
            reply = "SICA College offers a variety of essential facilities to ensure a comfortable and productive environment for its students. These include parking facilities, a well-equipped library, sports facilities, Wi-Fi connectivity, and more, designed to support students' academic and extracurricular activities.";
        }
    }

    else {
        reply = "I'm sorry, I didn't understand that. Can you rephrase?";
    }

    res.json({ reply });
});

// app.post('/chat', async (req, res) => {
//     const { message } = req.body;

//     try {
//         const response = await manager.process('en', message);

//         if (response.score > 0.5) {
//             const intentResponse = await Response.findOne({ intent: response.intent });

//             if (intentResponse) {
//                 // Check for specific conditions
//                 const condition = intentResponse.conditions.find(c =>
//                     new RegExp(c.match, 'i').test(message)
//                 );

//                 const reply = condition ? condition.response : intentResponse.defaultResponse;
//                 return res.status(200).json({ reply });
//             } else {
//                 return res.status(404).json({ reply: "I don't have an answer for that yet. Let me learn!" });
//             }
//         } else {
//             return res.status(200).json({ reply: "I'm sorry, I didn't understand that. Could you rephrase your question?" });
//         }
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "An error occurred while processing your request." });
//     }
// });

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});