let athena;
let s3_bucket, db_name, table_name;
let loading = document.getElementById("loading_box");

$(document).ready(function () {
    document.getElementById("aws_key").value = config.accessKeyId;
    document.getElementById("aws_secret").value = config.secretAccessKey;
    document.getElementById("aws_region").value = config.region;
    document.getElementById("aws_s3").value = config.s3_bucket;
    document.getElementById("db_name").value = config.db_name;
    document.getElementById("table_name").value = config.table_name;
    setInformation();
})

document.getElementById("save_info").addEventListener("click", function () {
    setInformation();
});

function setInformation() {
    athena = new AWS.Athena({
        accessKeyId: document.getElementById("aws_key").value,
        secretAccessKey: document.getElementById("aws_secret").value,
        region: document.getElementById("aws_region").value
    });
    s3_bucket = document.getElementById("aws_s3").value;
    db_name = document.getElementById("db_name").value;
    table_name = document.getElementById("table_name").value;
}

function loader(flag) {
    if (flag == true) {
        if (loading.style.display == "none") loading.style.display = "block";
    } else {
        if (loading.style.display == "block") loading.style.display = "none";
    }
}

function showAthenaData() {
    loader(true);
    startQueryExecution(function (queryExecutionId) {
        getQueryExecution(queryExecutionId, function () {
            getQueryResults(queryExecutionId, function (data) {
                showData(data);
                loader(false);
            });
        });
    });
};

function startQueryExecution(callback) {
    var params = {
        QueryString: 'SELECT * FROM "' + db_name + '"."' + table_name + '" limit ' + document.getElementById("limit").value,
        ResultConfiguration: {
            OutputLocation: s3_bucket
        }
    };
    athena.startQueryExecution(params, function (err, data) {
        if (err) {
            console.log(err);
            loader(false);
            alertBanner(err);
            return;
        }
        callback(data.QueryExecutionId);
    });
}

function getQueryExecution(queryExecutionId, callback) {
    var params = {
        QueryExecutionId: queryExecutionId
    };
    athena.getQueryExecution(params, function (err, data) {
        if (err) {
            console.log(err);
            loader(false);
            alertBanner(err);
            return;
        }
        if (data.QueryExecution.Status.State == 'RUNNING') {
            getQueryExecution(queryExecutionId, callback);
            return;
        }
        callback();
    });
}

function getQueryResults(queryExecutionId, callback) {
    var params = {
        QueryExecutionId: queryExecutionId
    };
    athena.getQueryResults(params, function (err, data) {
        if (err) {
            console.log(err);
            loader(false);
            alertBanner(err);
            return;
        }
        callback(data);
    });
}

function showData(data) {
    let table = '';
    for (var i = 0; i < data.ResultSet.Rows.length; i++) {
        if (i == 0) table += '<thead>';
        if (i == 1) table += '<tbody>';
        table += '<tr>';
        for (colNo in data.ResultSet.Rows[i].Data) {
            table += '<td>';
            table += data.ResultSet.Rows[i].Data[colNo].VarCharValue;
            table += '</td>';
        }
        table += '</tr>';
        if (i == 0) table += '</thead>';
        if (i == data.ResultSet.Rows.length - 1) table += '</tbody>';
    };
    document.getElementById("athena_table").innerHTML = '<table id="athena_data" class="table table-striped table-bordered"></table>';
    document.getElementById("athena_data").innerHTML = table;
    $('#athena_data').DataTable();
};

function alertBanner(err) {
    let html = '';
    html += '<div class="alert alert-warning alert-dismissible fade show" role="alert">';
    html += err;
    html += '<button type="button" class="close" data-dismiss="alert" aria-label="Close">';
    html += '<span aria-hidden="true">&times;</span>';
    html += '</button>';
    html += '</div>';
    document.getElementById("alert_popup").innerHTML = html;
}