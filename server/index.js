const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { NlpManager } = require('node-nlp');
const mongoose = require('mongoose');
const BotSchema = require('./model/BotSchema');
const app = express();
app.use(bodyParser.json());
app.use(cors());
// mongodb://localhost:27017/nlpData
mongoose.connect("mongodb+srv://harshitsingharya24:AlLLGk8qXY9fzHJA@cluster0.afo0r.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.log('Error connecting to MongoDB: ', err);
});

const manager = new NlpManager({ languages: ['en'] });

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
        else if (message.toLowerCase().includes('location') || message.toLowerCase().includes('address')) {
            reply = 'SICA College is located at Nipania Main Road, Near Iskcon Temple, ahead of Advanced Academy School, Indore, Madhya Pradesh 452010.';
        }
        else {
            reply = 'You can contact us via the provided phone : 0731-2974255, 8871729595, or 9669808182 or reach out by email for any queries : sicacollegeindore@gmail.com, antiragging@sicacollegeindore.com, grievance@sicacollegeindore.com.';
        }
    }

    else if (response.intent === 'general.query') {
        const normalizedMessage = message.toLowerCase();

        if (normalizedMessage.includes('what is sica college') || normalizedMessage.includes('about sica college') || normalizedMessage.includes('who is sica college') || normalizedMessage.includes('tell me about sica college') || normalizedMessage.includes('who is sica college') || normalizedMessage.includes('overview')) {
            reply = 'SICA College is affiliated with Devi Ahilya Vishwavidyalaya and approved by M.P. Higher Education, Bhopal. It offers UG programs like B.Com, BBA, BCA, BAJMC, and BA, with a focus on holistic education, academic excellence, and personal development.';
        } else if (normalizedMessage.includes('campus') || normalizedMessage.includes('big') || normalizedMessage.includes('large') || normalizedMessage.includes('size')) {
            reply = 'The campus of SICA College is not very large. It is shared with a school, and the space is more compact compared to other colleges. However, we focus on providing a strong educational experience in the available space.';
        }
        else if (normalizedMessage.includes('wifi') || normalizedMessage.includes('internet')) {
            reply = "Yes, SICA College provides Wi-Fi on campus. However, the connectivity may vary in different areas. It is generally available for students in most parts of the campus.";
        }
        else if (normalizedMessage.includes('computer lab') || normalizedMessage.includes('computers')) {
            reply = "SICA College has computer labs for students. You can access them during working hours, and there are a sufficient number of computers available, but still needs some improvement.";
        }
        else if (normalizedMessage.includes('what is the aim of sica college') || normalizedMessage.includes('what is the goal of sica college') || normalizedMessage.includes('what is the mission of sica college')) {
            reply = 'The aim of SICA College is to provide a holistic education that fosters academic excellence, personal growth, and cultural values. We prepare students for successful careers and responsible citizenship through critical thinking and innovation.';
        } else if (normalizedMessage.includes('mission of sica college') || normalizedMessage.includes('vision of sica college')) {
            reply = 'SICA College’s mission is to provide students with a balanced approach to education, focusing on both academic achievement and personal development, while nurturing a sense of cultural responsibility and ethical values.';
        } else if (normalizedMessage.includes('affiliated') || normalizedMessage.includes('institution') || normalizedMessage.includes('approval')) {
            reply = 'SICA College is affiliated with Devi Ahilya Vishwavidyalaya and approved by M.P. Higher Education, Bhopal.';
        } else if (normalizedMessage.includes('unique') || normalizedMessage.includes('stand out')) {
            reply = 'SICA College stands out for its emphasis on holistic education, blending academic learning with personal development, cultural values, and social responsibility.';
        } else if (message.toLowerCase().includes('campus') || message.toLowerCase().includes('building')) {
            reply = 'The campus of SICA College is shared with a school, and the facilities are not very large. While the campus is compact, we strive to offer a supportive learning environment. The faculty is continually working to improve, and although the student population is smaller compared to some larger colleges, the focus is on personalized education and attention.';
        } else if (message.toLowerCase().includes('faculty')) {
            reply = 'The faculty at SICA College is dedicated to the students’ growth, but we acknowledge that there is room for improvement. The focus is on providing personalized education and support.';
        } else if (message.toLowerCase().includes('students')) {
            reply = 'SICA College has a smaller student population compared to other colleges. This allows for more individual attention and better student-teacher interaction.';
        } else if (normalizedMessage.includes('facilities') || normalizedMessage.includes('amenities') || normalizedMessage.includes('resources')) {
            reply = 'SICA College offers a library, computer labs, clean drinking water, and basic sports facilities. The focus is on providing a supportive learning environment, though the infrastructure is compact and shared with a school.';
        } else if (normalizedMessage.includes('library') || normalizedMessage.includes('liberary')) {
            reply = 'SICA College provides a library with resources to support students in their academic pursuits. It is a quiet space dedicated to learning and research.';
        } else if (normalizedMessage.includes('sports')) {
            reply = 'SICA College has basic sports facilities to encourage physical activities among students, promoting a balanced approach to health and academics.';
        } else if (normalizedMessage.includes('canteen')) {
            reply = 'SICA College provides a canteen facility for students to enjoy meals and refreshments in a comfortable space.';
        } else if (normalizedMessage.includes('labs')) {
            reply = 'SICA College have a computer lab equipped with software and hardware and a physics lab to support students learning needs.';
        } else if (normalizedMessage.includes('extracurricular') || normalizedMessage.includes('activities')) {
            reply = 'SICA College organizes extracurricular activities such as cultural events and competitions to encourage overall student development.';
        } else if (normalizedMessage.includes('hostel')) {
            reply = 'Currently, SICA College does not offer hostel facilities, but it ensures that students have access to the necessary resources for their education.';
        }
        else if (normalizedMessage.includes('private')) {
            reply = 'SICA College is a private college affliliated to DAVV and approved by M.P. Higher Education, Bhopal.';
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

        if (normalizedMessage.includes('pg') || normalizedMessage.includes('master') ||
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
        } else {
            const courseNames = Object.keys(feesMapping);

            const matchedCourses = courseNames.filter(course => {
                const regex = new RegExp(`\\b${course}\\b`, 'i'); // Use word boundary to match the exact course
                return regex.test(normalizedMessage);
            });

            if (matchedCourses.length > 0) {
                const feesDetails = matchedCourses
                    .map(course => `${course.toUpperCase()} - ${feesMapping[course]}`)
                    .join(', ');
                reply = `The fees for the requested courses are: ${feesDetails}.`;
            } else {
                const allFees = Object.entries(feesMapping)
                    .map(([course, fee]) => `${course.toUpperCase()} - ${fee}`)
                    .join(', ');
                reply = `The fees for our UG programs are as follows: ${allFees}. Fees are subject to change based on college policies.`;
            }
        }
    }

    else if (response.intent === 'course.query') {
        let courses = [];
        const normalizedMessage = message.toLowerCase();

        const courseKeywords = {
            bca: 'BCA, a comprehensive course focusing on computer applications and software development.',
            bba: 'BBA, focusing on business management and entrepreneurial skills.',
            bcom: 'B.Com, focusing on commerce, accounting, and business practices.',
            bajmc: 'BAJMC, a multidisciplinary program in Journalism and Mass Communication.',
            ba: 'BA, providing a foundation in the humanities with various subject options.'
        };

        if (normalizedMessage.includes('pg') ||
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
            normalizedMessage.includes('med')) {
            reply = 'Currently, SICA College does not offer any postgraduate (PG) courses. However, we are planning to introduce PG courses in the future.';
        }
        else if (normalizedMessage.includes('eligiblity') || normalizedMessage.includes('eligblity') || normalizedMessage.includes('eligible')) {
            reply = 'You can contact us via the provided phone : 0731-2974255, 8871729595, or 9669808182 or to check you eligiblity for your desired course'
        }
        else {
            const tokens = normalizedMessage
                .replace(/,| and /g, ' ')
                .split(' ')
                .filter(token => token.trim().length > 0);

            tokens.forEach(token => {
                if (courseKeywords[token]) {
                    courses.push(courseKeywords[token]);
                }
            });

            if (courses.length > 0) {
                reply = `SICA College offers ${courses.join(' ')}`;
            }

            else {
                reply = 'Our UG programs include B.Com, BBA, BCA, BAJMC, and BA. Admissions are based on merit.';
            }
        }
    }

    else if (response.intent === 'placement.query') {
        reply = "SICA College provides basic placement assistance and training to its students. While the placement opportunities are still developing, the college focuses on equipping students with the skills needed to explore opportunities independently or pursue higher education.";
    }

    else {
        reply = "I'm sorry, I didn't understand that. Can you rephrase?";
    }

    res.json({ reply });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});