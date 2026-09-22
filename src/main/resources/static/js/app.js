async function api(
    url,
    method = "GET",
    body = null
) {

    const options = {
        method: method,

        credentials: "same-origin",

        headers: {
            "Accept": "application/json"
        }
    };


    if (body !== null) {

        options.headers[
            "Content-Type"
        ] = "application/json";

        options.body =
            JSON.stringify(body);
    }


    try {

        const response =
            await fetch(
                url,
                options
            );


        let data = {};

        try {

            data =
                await response.json();

        } catch (error) {

            data = {};
        }


        if (
            !response.ok &&
            !data.message
        ) {

            data.message =
                `Request failed (${response.status})`;
        }


        return {
            ok: response.ok,
            status: response.status,
            data: data
        };

    } catch (error) {

        return {

            ok: false,

            status: 0,

            data: {
                message:
                    "Unable to connect to the server."
            }
        };
    }
}