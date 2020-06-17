const sgMail=require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail=(email,name)=>{
    sgMail.send({
        to:email,
        from:'sndmail2sushant@gmail.com',
        subject:'thanks for joiing',
        text:`welcome to the app , ${name} .let me know how it is `,
      
        })
}

const sendCancelEmail=(email,name)=>{
    sgMail.send({
        to:email,
        from:'sndmail2sushant@gmail.com',
        subject:'cancellation email',
        text:`Soory  to see you go , ${name} .let me know how it is `,
      
        })
}

module.exports={
    sendWelcomeEmail,
    sendCancelEmail
}