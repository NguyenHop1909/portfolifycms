document.getElementById('save-btn')
    .addEventListener('click', async () => {

        const data = {

            name:
                document.getElementById('name').value,

            subtitle:
                document.getElementById('subtitle').value,

            intro:
                document.getElementById('intro').value
        };

        await fetch(
            'http://localhost:3000/save-profile',
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify(data)
            }
        );

        alert('Saved!');
    });